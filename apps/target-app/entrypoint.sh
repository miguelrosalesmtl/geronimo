#!/usr/bin/env sh
set -eu

mkdir -p "$(dirname "${DJANGO_DB_PATH:-/app/data/db.sqlite3}")"

python manage.py migrate --noinput

# createsuperuser --noinput reads DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD
# from the environment. It fails if the user already exists (e.g. a restart
# against a volume-mounted DB) -- that's fine, ignore it.
if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ]; then
  python manage.py createsuperuser --noinput \
    --username "$DJANGO_SUPERUSER_USERNAME" \
    --email "${DJANGO_SUPERUSER_EMAIL:-admin@example.com}" \
    || echo "createsuperuser: '$DJANGO_SUPERUSER_USERNAME' already exists, skipping"
fi

exec python manage.py runserver 0.0.0.0:8000
