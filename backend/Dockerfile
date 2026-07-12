# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2, etc.
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source code
COPY . /app

ENV PYTHONUNBUFFERED=1

# Use your existing Flask entrypoint
CMD ["python", "main.py"]