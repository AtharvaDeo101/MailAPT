FROM python:3.10-slim

WORKDIR /app

COPY backend/ ./backend/
COPY requirements.docker.txt ./requirements.docker.txt

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.docker.txt
RUN pip install --no-cache-dir gunicorn  # Add production WSGI server

RUN mkdir -p ./flask_session

# Environment variables (keep if your app uses them)
ENV FLASK_APP=backend/main.py
ENV FLASK_ENV=production
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

EXPOSE 5000

# Use Gunicorn instead of Flask development server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.OAuth:app"]