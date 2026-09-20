# A throwaway Django admin app: SQLite, DEBUG on, a seeded superuser.
# Exists purely to give apps/e2e a real login/create-user flow to test
# locally -- not a template for anything production-shaped.

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

ENV DJANGO_DB_PATH=/app/data/db.sqlite3
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
