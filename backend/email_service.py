import base64
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import unescape
from googleapiclient.errors import HttpError


from bs4 import BeautifulSoup
from flask import Blueprint, current_app, jsonify, request, session

from OAuth import get_gmail_service



email_bp = Blueprint("email_bp", __name__)


def generate_with_api(prompt: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a professional email writing assistant. "
                "When given a topic or instruction, write a complete professional email. "
                "Always format your response exactly as:\n"
                "Subject: <subject line>\n\n"
                "<email body starting with Dear...>"
                "\n\nDo not include any explanation outside the email itself."
            ),
        },
        {"role": "user", "content": f"Write a professional email about: {prompt}"},
    ]

    response = current_app.hf_client.chat.completions.create(
        model=current_app.config["HF_MODEL"],
        messages=messages,
        max_tokens=400,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def summarize_with_api(content: str, summary_type: str = "brief") -> str:
    if summary_type == "brief":
        instruction = (
            "Give a brief 2-3 sentence summary of this email. "
            "Include the main point, any action items, and the tone."
        )
    else:
        instruction = (
            "Summarize this email in detail. Include:\n"
            "- Key Points (bullet list)\n"
            "- Action Items (bullet list)\n"
            "- Sentiment (one phrase describing the tone)"
        )

    messages = [
        {
            "role": "system",
            "content": "You are an expert email summarizer. Be concise and accurate.",
        },
        {"role": "user", "content": f"{instruction}\n\nEmail:\n{content}"},
    ]

    response = current_app.hf_client.chat.completions.create(
        model=current_app.config["HF_MODEL"],
        messages=messages,
        max_tokens=300,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def _decode_body(data: str) -> str:
    if not data:
        return ""
    decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    return unescape(decoded)


def _html_to_text(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(ln for ln in lines if ln)


def extract_email_body(payload):
    plain_body = ""
    html_body = ""

    def walk_parts(part):
        nonlocal plain_body, html_body
        mime_type = part.get("mimeType", "")
        body_data = part.get("body", {}).get("data")

        if mime_type == "text/plain" and body_data and not plain_body:
            plain_body = _decode_body(body_data)
        elif mime_type == "text/html" and body_data and not html_body:
            html_body = _decode_body(body_data)

        for sub in part.get("parts", []) or []:
            walk_parts(sub)

    if "parts" in payload:
        for p in payload["parts"]:
            walk_parts(p)
    else:
        mime_type = payload.get("mimeType", "")
        data = payload.get("body", {}).get("data")
        if mime_type == "text/plain" and data:
            plain_body = _decode_body(data)
        elif mime_type == "text/html" and data:
            html_body = _decode_body(data)

    if not plain_body and html_body:
        plain_body = _html_to_text(html_body)

    return {"plain_body": plain_body, "html_body": html_body}


@email_bp.route("/send_email", methods=["POST"])
def send_email():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    try:
        content_type = request.content_type or ""

        if "multipart/form-data" in content_type:
            to = request.form.get("to", "").strip()
            subject = request.form.get("subject", "")
            body = request.form.get("body", "")
            uploaded_files = request.files.getlist("attachments")
        else:
            data = request.get_json(force=True, silent=True) or {}
            to = (data.get("to") or "").strip()
            subject = data.get("subject", "")
            body = data.get("body", "")
            uploaded_files = []

        if not to or not body:
            return jsonify({"error": "to and body are required"}), 400

        if uploaded_files:
            message = MIMEMultipart()
            message["to"] = to
            message["subject"] = subject
            message.attach(MIMEText(body, "plain"))

            for f in uploaded_files:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{f.filename}"',
                )
                message.attach(part)
        else:
            message = MIMEText(body)
            message["to"] = to
            message["subject"] = subject

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()

        return jsonify({
            "message": "sent",
            "id": sent.get("id"),
            "attachments_count": len(uploaded_files),
        })

    except Exception as e:
        current_app.logger.error(f"send_email error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@email_bp.route("/list_emails", methods=["GET"])
def list_emails():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    max_results = min(request.args.get("max_results", 50, type=int) or 50, 50)
    query = request.args.get("q", "")
    page_token = request.args.get("page_token")

    try:
        list_request = (
            service.users()
            .messages()
            .list(
                userId="me",
                maxResults=max_results,
                q=query,
                pageToken=page_token,
                fields="messages/id,nextPageToken,resultSizeEstimate",
            )
        )

        result = list_request.execute()
        messages = result.get("messages", [])

        if not messages:
            return jsonify({
                "emails": [],
                "nextPageToken": result.get("nextPageToken"),
                "resultSizeEstimate": result.get("resultSizeEstimate", 0),
            })

        email_map = {}

        def batch_callback(request_id, response, exception):
            if exception is not None:
                email_map[request_id] = {
                    "id": request_id,
                    "subject": "",
                    "from": "",
                    "date": "",
                }
                return

            headers = response.get("payload", {}).get("headers", [])

            def get_header(name):
                return next(
                    (
                        h.get("value", "")
                        for h in headers
                        if h.get("name", "").lower() == name.lower()
                    ),
                    "",
                )

            email_map[request_id] = {
                "id": response.get("id", request_id),
                "subject": get_header("Subject"),
                "from": get_header("From"),
                "date": get_header("Date"),
            }

        batch = service.new_batch_http_request()

        for m in messages:
            msg_id = m["id"]
            batch.add(
                service.users().messages().get(
                    userId="me",
                    id=msg_id,
                    format="metadata",
                    metadataHeaders=["Subject", "From", "Date"],
                    fields="id,payload/headers",
                ),
                request_id=msg_id,
                callback=batch_callback,
            )

        batch.execute()

        email_list = [email_map[m["id"]] for m in messages if m["id"] in email_map]

        return jsonify({
            "emails": email_list,
            "nextPageToken": result.get("nextPageToken"),
            "resultSizeEstimate": result.get("resultSizeEstimate", 0),
        })

    except Exception as e:
        current_app.logger.error(f"list_emails error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    
@email_bp.route("/get_email/<path:email_id>", methods=["GET"])
def get_email(email_id):
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    try:
        current_app.logger.info(f"GET /get_email called with id={email_id}")

        msg = (
            service.users()
            .messages()
            .get(userId="me", id=email_id, format="full")
            .execute()
        )

        payload = msg.get("payload", {})
        headers = payload.get("headers", [])
        bodies = extract_email_body(payload)

        subject = next(
            (h.get("value", "") for h in headers if h.get("name", "").lower() == "subject"),
            "",
        )
        from_value = next(
            (h.get("value", "") for h in headers if h.get("name", "").lower() == "from"),
            "",
        )
        date_value = next(
            (h.get("value", "") for h in headers if h.get("name", "").lower() == "date"),
            "",
        )

        return jsonify({
            "id": msg.get("id", email_id),
            "subject": subject,
            "from": from_value,
            "date": date_value,
            "body": bodies.get("plain_body", "") or "",
            "plain_body": bodies.get("plain_body", "") or "",
            "html_body": bodies.get("html_body", "") or "",
        })

    except HttpError as e:
        current_app.logger.error(f"Gmail API HttpError in get_email: {e}", exc_info=True)
        try:
            status_code = getattr(e, "status_code", None) or getattr(e.resp, "status", 500)
        except Exception:
            status_code = 500
        return jsonify({"error": f"Gmail API error: {str(e)}"}), status_code

    except Exception as e:
        current_app.logger.error(f"get_email error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@email_bp.route("/create_draft", methods=["POST"])
def create_draft():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    to, subject, body = data.get("to"), data.get("subject"), data.get("body")

    if not all([to, subject, body]):
        return jsonify({"error": "to, subject, body are required"}), 400

    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    draft = (
        service.users()
        .drafts()
        .create(userId="me", body={"message": {"raw": raw}})
        .execute()
    )

    return jsonify({"message": "draft_created", "id": draft.get("id")})


@email_bp.route("/list_labels", methods=["GET"])
def list_labels():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    result = service.users().labels().list(userId="me").execute()
    return jsonify({"labels": result.get("labels", [])})


@email_bp.route("/generate_email", methods=["POST"])
def generate_email():
    if "credentials" not in session:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    try:
        text = generate_with_api(prompt)
        lines = text.strip().splitlines()
        subject, body_lines = "", []

        for i, line in enumerate(lines):
            if line.lower().startswith("subject:"):
                subject = line[len("subject:"):].strip()
                body_lines = lines[i + 1:]
                break

        while body_lines and not body_lines[0].strip():
            body_lines.pop(0)

        body = "\n".join(body_lines).strip()

        if not subject:
            subject = prompt[:60]
        if not body:
            body = text.strip()

        return jsonify({"subject": subject, "body": body, "raw_output": text})

    except Exception as e:
        current_app.logger.error(f"generate_email error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@email_bp.route("/summarize_email", methods=["POST"])
def summarize_email():
    if "credentials" not in session:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    content = data.get("content")
    summary_type = data.get("type", "brief")

    if not content:
        return jsonify({"error": "content is required"}), 400

    try:
        summary = summarize_with_api(content, summary_type=summary_type)
        return jsonify({
            "summary": summary,
            "type": summary_type,
            "original_length": len(content),
            "summary_length": len(summary),
        })

    except Exception as e:
        current_app.logger.error(f"summarize_email error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500