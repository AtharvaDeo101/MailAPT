import os
import subprocess
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# main.py decides http-vs-https at import time, so each case needs a fresh
# interpreter rather than an importlib.reload that would leak into other tests.
PROBE = (
    "import main, os;"
    " app = main.create_app();"
    " print(app.config['SESSION_COOKIE_SECURE'],"
    " app.config['SESSION_COOKIE_SAMESITE'],"
    " os.environ.get('OAUTHLIB_INSECURE_TRANSPORT'))"
)


def _probe(redirect_uri, **extra):
    env = {
        **os.environ,
        "REDIRECT_URI": redirect_uri,
        "DATABASE_URL": "sqlite://",
        "FLASK_SECRET_KEY": "k",
        "GOOGLE_CLIENT_ID": "c",
        "GOOGLE_CLIENT_SECRET": "s",
        "HF_API_TOKEN": "h",
        **extra,
    }
    env.pop("OAUTHLIB_INSECURE_TRANSPORT", None)
    return subprocess.run(
        [sys.executable, "-c", PROBE], cwd=BACKEND, env=env,
        capture_output=True, text=True,
    )


def test_https_redirect_uri_hardens_cookies_and_oauth():
    out = _probe("https://api.example.com/oauth2callback").stdout.split()
    # Secure so the cookie only rides https; None so it survives a cross-site
    # frontend; oauthlib must refuse a plaintext token exchange.
    assert out == ["True", "None", "None"]


def test_http_redirect_uri_stays_usable_in_dev():
    out = _probe("http://localhost:5000/oauth2callback").stdout.split()
    assert out == ["False", "Lax", "1"]


def test_deployed_without_secret_key_refuses_to_boot():
    # otherwise every restart silently signs out every user
    result = _probe("https://api.example.com/oauth2callback", FLASK_SECRET_KEY="")
    assert result.returncode != 0
    assert "FLASK_SECRET_KEY" in result.stderr
