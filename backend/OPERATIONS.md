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

## Optional: Protect patient enrollment

By default `POST /auth/patient-enrollment` is publicly available to allow
patients to bind their account to an existing Beneficiary ID. To disable
public enrollment (for stricter security) set the environment variable
`PROTECT_PATIENT_ENROLLMENT=true`. When set, the enrollment endpoint will be
rejecting requests with HTTP 403 and an operator must create patient accounts
via admin/staff workflows.


