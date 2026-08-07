# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# ponytail: one worker on purpose. gateway.py's rate limiter and response cache
# are in-process dicts and sessions are files on this container's disk, so a
# second worker would double the limits and split the session store. Threads
# scale this fine until then; more workers means moving both to Redis first.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "8", \
     "--timeout", "120", "--access-logfile", "-", "main:app"]