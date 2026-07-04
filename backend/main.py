import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_session import Session
from huggingface_hub import InferenceClient

from email_service import email_bp
from OAuth import oauth_bp

load_dotenv()

os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)

    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

    app.config.update(
        SESSION_TYPE="filesystem",
        SESSION_FILE_DIR="./flask_session",
        SESSION_PERMANENT=False,
        SESSION_USE_SIGNER=True,
        SESSION_COOKIE_NAME="session",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=1800,
        GOOGLE_CLIENT_ID=os.environ.get("GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET=os.environ.get("GOOGLE_CLIENT_SECRET"),
        SCOPES=[
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify",
        ],
        FRONTEND_URL=os.environ.get("FRONTEND_URL", "http://localhost:3000/generate"),
        REDIRECT_URI=os.environ.get("REDIRECT_URI", "http://localhost:5000/oauth2callback"),
        HF_API_TOKEN=os.environ.get("HF_API_TOKEN"),
        HF_MODEL="meta-llama/Llama-3.1-8B-Instruct",
    )

    os.makedirs("./flask_session", exist_ok=True)

    Session(app)

    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/*": {
                "origins": [frontend_origin]
            }
        },
    )

    app.hf_client = InferenceClient(token=app.config["HF_API_TOKEN"])

    @app.get("/health")
    def health():
        return jsonify({"ok": True, "frontend_origin": frontend_origin})

    app.register_blueprint(oauth_bp)
    app.register_blueprint(email_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)