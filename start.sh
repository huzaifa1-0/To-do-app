#!/bin/sh
set -e

cd /app/backend 2>/dev/null || cd backend

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn core.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
