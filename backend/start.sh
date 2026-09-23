#!/usr/bin/env bash
set -e

echo "==> Running Alembic migrations..."
python -m alembic upgrade head

echo "==> Seeding demo data (idempotent)..."
python -m app.manage seed-demo --ensure-tables

echo "==> Starting Uvicorn server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
