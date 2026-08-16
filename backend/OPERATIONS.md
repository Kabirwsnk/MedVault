# MedVault operations

1. Copy `.env.example` to `.env` and replace every placeholder. Do not reuse the
   previously hard-coded database password or JWT key; rotate both before use.
2. Run `alembic -c alembic.ini upgrade head` from `backend/` before starting the
   application. The initial revision creates a new database schema.
3. Start with `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
4. Run regression checks with `python -m unittest discover -s tests`.

The pre-Alembic development database needs a backup and a one-time reconciliation
before it can be stamped. Do not stamp it blindly: its current tables lack fields
introduced by the baseline, including clinical authorship and inventory movements.
Create a fresh database for the first production deployment, or generate and review
a database-specific reconciliation migration against a backup.
