# MedVault operations

1. Copy `.env.example` to `.env` and replace every placeholder. Do not reuse the
   previously hard-coded database password or JWT key; rotate both before use.
2. Run `alembic -c alembic.ini upgrade head` from `backend/` before starting the
   application. The initial revision creates a new database schema.
3. Start with `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
4. Run regression checks with `python -m unittest discover -s tests`.

The database pool defaults are controlled by `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`,
`DB_POOL_TIMEOUT`, and `DB_POOL_RECYCLE`. Increase them only after considering
the number of application workers and the PostgreSQL server's connection limit;
pool settings should scale with expected concurrent user load, not independently
of the database capacity.

`RATE_LIMIT_STORAGE_URI` defaults to `memory://` for local development. Use a
shared Redis URI in a multi-worker deployment so login limits apply across all
API processes rather than separately inside each process.

The pre-Alembic development database needs a backup and a one-time reconciliation
before it can be stamped. Do not stamp it blindly: its current tables lack fields
introduced by the baseline, including clinical authorship and inventory movements.
Create a fresh database for the first production deployment, or generate and review
a database-specific reconciliation migration against a backup.

## Creating the first admin (bootstrap)

In a fresh environment there is no `admin` user and `POST /auth/register` is
guarded by an existing admin. To create a first admin safely, use the
management helper provided by the application:

1. Activate your virtualenv and ensure `.env` (or env vars) are set, including
   `DATABASE_URL` and `JWT_SECRET_KEY`.

2. Create tables (if needed) and the initial admin (example, Windows PowerShell):

```powershell
cd backend
venv\Scripts\activate
python -m app.manage create-admin --ensure-tables --email admin@example.com --password "YourStrongPassword"
```

The command is idempotent: if any admin user already exists it will no-op.
Do NOT check the password into source control. For automated provisioning you
may prefer to call the underlying function from an initialization script or
CI job rather than embedding secrets in migrations.

## Patient enrollment protection

By default `POST /auth/patient-enrollment` requires an authenticated admin or
registration worker because enrollment changes account ownership for a patient.
For local-only demos that need the legacy public flow, explicitly set
`PROTECT_PATIENT_ENROLLMENT=false`. Never use that opt-out in a shared or
production deployment.


