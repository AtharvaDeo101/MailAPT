import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_session import Session
from huggingface_hub import InferenceClient

# NEW: import DB base and session
from db import Base, engine

from email_service import email_bp
from OAuth import oauth_bp

load_dotenv()

# OAuthlib config
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)

    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

    # --- Flask session & Gmail / HF config ---
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

    # --- NEW: Database configuration (PostgreSQL) ---
    # CRITICAL FIX: default host is "db" (Docker service name), not "localhost"
    db_user = os.environ.get("POSTGRES_USER", "mailapt")
    db_password = os.environ.get("POSTGRES_PASSWORD", "mailaptpassword")
    db_host = os.environ.get("POSTGRES_HOST", "db")  # ← CHANGED from "localhost" to "db"
    db_port = os.environ.get("POSTGRES_PORT", "5432")
    db_name = os.environ.get("POSTGRES_DB", "mailapt")

    app.config["DATABASE_URL"] = os.environ.get(
        "DATABASE_URL",
        f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}",
    )

    # Make sure the session directory exists
    os.makedirs("./flask_session", exist_ok=True)

    # Initialize server-side sessions
    Session(app)

    # CORS for Next.js frontend
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/*": {
                "origins": [frontend_origin],
            }
        },
    )

    # Hugging Face client
    app.hf_client = InferenceClient(token=app.config["HF_API_TOKEN"])

    # --- NEW: Create tables on startup ---
    with app.app_context():
        Base.metadata.create_all(bind=engine)

    # Health check endpoint
    @app.get("/health")
    def health():
        return jsonify(
            {
                "ok": True,
                "frontend_origin": frontend_origin,
                "database_url": app.config.get("DATABASE_URL"),
            }
        )

    # Register blueprints
    app.register_blueprint(oauth_bp)
    app.register_blueprint(email_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)