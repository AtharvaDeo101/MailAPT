"""Names the app remembers, so generated mail stops shipping "[Your Name]".

Pure string helpers — no Flask, no DB. Storage lives in UserSettings.data
(see email_service.py); this module only decides what counts as a name and
where to find one.

Run `python known_names.py` for the self-check.
"""

import re

# "Dear Priya," / "Hi Priya:" — the name always sits between the greeting
# word and the punctuation.
_GREETING_RE = re.compile(r"^\s*(?:dear|hi|hello|hey)\s+([^,:\n]+?)\s*[,:]", re.I)
_PLACEHOLDER_RE = re.compile(r"\[([^\[\]\n]{1,40})\]")

# Words that sit where a name goes but name nobody in particular. Learning one
# of these would poison every later email, so they never get stored.
_NOT_A_NAME = {
    "all", "boss", "colleagues", "everybody", "everyone", "folks", "friend",
    "hiring manager", "madam", "manager", "name", "recipient", "sir",
    "sir/madam", "team", "there", "to whom it may concern",
    # sign-offs, which is what the last line usually is when there is no name
    "best", "best regards", "best wishes", "cheers", "kind regards", "regards",
    "respectfully", "sincerely", "thank you", "thanks", "warm regards",
    "yours sincerely", "yours truly",
}

_SENDER_HINTS = ("your name", "my name", "sender", "signature", "full name")
_RECIPIENT_HINTS = ("recipient", "manager", "their name", "receiver", "boss")

_NAME_RE = re.compile(r"[A-Za-z][A-Za-z.'\-]*(?: [A-Za-z][A-Za-z.'\-]*)*")


def clean_name(value):
    """Normalised personal name, or None when it doesn't look like one."""
    if not isinstance(value, str):
        return None

    value = value.strip().strip(".,!;").strip()
    if not value or len(value) > 40 or not 1 <= len(value.split()) <= 3:
        return None
    if value.lower() in _NOT_A_NAME:
        return None
    if not _NAME_RE.fullmatch(value):
        return None

    return value


def greeting_name(body):
    """Recipient's name from the greeting line, e.g. 'Dear Priya,' -> Priya."""
    for line in (body or "").splitlines():
        if not line.strip():
            continue
        match = _GREETING_RE.match(line)
        return clean_name(match.group(1)) if match else None
    return None


def signature_name(body):
    """Sender's name from the sign-off, e.g. 'Regards,\\nAtharva' -> Atharva."""
    lines = [line.strip() for line in (body or "").splitlines() if line.strip()]
    if len(lines) < 2:  # a lone line is the message, not a signature
        return None
    return clean_name(lines[-1])


def fill_placeholders(text, sender=None, recipient=None):
    """Swap [Your Name] / [Manager's Name] for names we already know.

    Placeholders we can't map are left as-is on purpose: a visible bracket is
    a better outcome than a confidently wrong name.
    """

    def swap(match):
        label = match.group(1).lower()
        if sender and any(hint in label for hint in _SENDER_HINTS):
            return sender
        if recipient and any(hint in label for hint in _RECIPIENT_HINTS):
            return recipient
        return match.group(0)

    return _PLACEHOLDER_RE.sub(swap, text or "")


def _self_check():
    assert clean_name("Priya Sharma") == "Priya Sharma"
    assert clean_name("  Atharva.  ") == "Atharva"
    assert clean_name("Team") is None
    assert clean_name("Best regards") is None
    assert clean_name("[Your Name]") is None
    assert clean_name("the whole engineering department") is None
    assert clean_name("Agent 47") is None
    assert clean_name(None) is None

    body = "Dear Priya,\n\nThe report is attached.\n\nBest regards,\nAtharva"
    assert greeting_name(body) == "Priya"
    assert signature_name(body) == "Atharva"

    assert greeting_name("Dear Team,\n\nHi.\n\nAtharva") is None
    assert signature_name("Dear Priya,\n\nSee attached.\n\nRegards,") is None
    assert signature_name("Just this one line") is None

    filled = fill_placeholders(
        "Dear [Manager's Name],\n\nPlease approve.\n\nRegards,\n[Your Name]",
        sender="Atharva",
        recipient="Priya",
    )
    assert "Dear Priya," in filled and filled.endswith("Atharva"), filled

    # nothing known -> brackets survive rather than turning into "None"
    unchanged = "Regards,\n[Your Name] at [Company]"
    assert fill_placeholders(unchanged) == unchanged
    assert fill_placeholders(unchanged, sender="Atharva") == "Regards,\nAtharva at [Company]"

    print("known_names: ok")


if __name__ == "__main__":
    _self_check()
