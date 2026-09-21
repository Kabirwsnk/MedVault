# MedVault

MedVault is a role-protected healthcare platform for managing beneficiary identity,
clinical encounters, prescriptions, pharmacy inventory, and patient health history.
It combines a FastAPI/PostgreSQL backend with a React single-page application and
uses transaction-level controls for identity allocation and medicine dispensing.

> **Project status:** Resume-ready local/demo system. The core workflows are
> implemented and tested; production deployment still requires infrastructure,
> load testing, and operational monitoring.

## What It Demonstrates

- JWT authentication with bcrypt password hashing and role-based access control.
- Object-level PHI authorization so patients can access only their own records.
- Collision-safe Beneficiary ID generation using a PostgreSQL advisory lock.
- Async FastAPI endpoints backed by SQLAlchemy async sessions and connection pooling.
- Atomic prescription dispensing with row locks and immutable inventory movements.
- Pydantic request validation, database constraints, rate limiting, and safe errors.
- React portals for registration, doctors, pharmacy staff, patients, and admins.

## Roles and Core Flows

| Role | Responsibilities |
| --- | --- |
| `admin` | Provision staff and oversee all operational areas |
| `registration_worker` | Register beneficiaries, update demographics, activate patient accounts |
| `doctor` | Create encounters, prescriptions, timelines, and clinical AI requests |
| `pharmacy` | Manage medicines, restock inventory, and dispense prescriptions |
| `patient` | View their own clinical history, prescriptions, and beneficiary card |

```text
Registration worker
    -> creates Patient + unique Beneficiary ID
Doctor
    -> creates MedicalRecord + Prescription
Pharmacy
    -> locks Prescription and Medicine rows
    -> decrements stock + writes InventoryMovement atomically
Patient
    -> views only the linked health history
```

## Architecture

```text
                         +----------------------+
                         | React 19 + TypeScript|
                         | Vite SPA             |
                         +----------+-----------+
                                    |
                              Bearer JWT
                                    |
                         +----------v-----------+
                         | FastAPI routers      |
                         | validation + RBAC    |
                         +----------+-----------+
                                    |
                         +----------v-----------+
                         | Async services       |
                         | transactions + locks |
                         +----------+-----------+
                                    |
                         +----------v-----------+
                         | PostgreSQL           |
                         | SQLAlchemy + Alembic |
                         +----------------------+
```

### Backend boundaries

- `routers/` exposes modular HTTP route groups.
- `schemas/` defines validated request and response contracts.
- `models/` defines relational entities and database constraints.
- `services/` owns multi-step business operations such as dispensing.
- `utils/` contains authentication, JWT, role, and authorization helpers.
- `ai/` builds patient context and supports OpenAI or offline fallback behavior.
- `migrations/` contains the Alembic schema history.

### Concurrency design

- Beneficiary ID allocation uses PostgreSQL advisory lock `260001`.
- Dispensing locks both the prescription and medicine rows before changing stock.
- `InventoryMovement.prescription_id` is unique, preventing duplicate dispense logs.
- Medicine names have a database-level unique constraint.
- Pool settings are environment-driven and should be sized with worker count and
  PostgreSQL connection capacity.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Lucide React |
| API | FastAPI, Uvicorn, Pydantic |
| Persistence | PostgreSQL, SQLAlchemy 2.x, `asyncpg`, Alembic |
| Authentication | JWT HS256, bcrypt, FastAPI dependencies |
| Abuse protection | SlowAPI; Redis-backed storage supported for multi-worker deployments |
| Documents | QR Code, Pillow, ReportLab |
| AI | OpenAI SDK with offline fallback |
| Tests | Python `unittest`, FastAPI `TestClient` |

## Run Locally

### Prerequisites

- Python 3.11+ and PostgreSQL.
- Node.js 20+ and npm.
- A database created for MedVault.

### Backend

```powershell
cd backend
python -m venv venv
venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` with a real database URL and a long random JWT secret.
Never commit that file. Then run migrations and start the API:

```powershell
alembic -c alembic.ini upgrade head
python -m app.manage create-admin --ensure-tables --email admin@example.com --password "UseARealPasswordHere"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API root: http://127.0.0.1:8000/
- Swagger: http://127.0.0.1:8000/docs

### Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173/ in a browser. The frontend uses
`VITE_API_URL` when provided and otherwise defaults to `http://localhost:8000`.

### Tests and build

```powershell
cd backend
.\\venv\\Scripts\\python.exe -m unittest discover -s tests

cd ..\\frontend
npm run build
```

Current validation baseline: 12 backend tests pass and the frontend production
build completes successfully.

## Configuration and Secrets

Only `backend/.env.example` belongs in version control. Local `.env` files,
virtual environments, build output, and archives are ignored by Git. Required
production values include:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `PROTECT_PATIENT_ENROLLMENT=true`
- `CORS_ORIGINS`

Useful operational settings include database pool values, stock thresholds,
`OPENAI_API_KEY`, and `RATE_LIMIT_STORAGE_URI`. Use a shared Redis URI for
rate limiting when running multiple API workers.

## Scalability Considerations

- Async endpoints and `AsyncSession` prevent database I/O from blocking the
  FastAPI event loop.
- SQLAlchemy pool sizing is configurable through `DB_POOL_SIZE`,
  `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, and `DB_POOL_RECYCLE`.
- Stateless JWT authentication allows multiple API workers behind a load balancer.
- PostgreSQL constraints and locks protect correctness under concurrent writes.
- SlowAPI limits repeated login attempts; Redis provides shared limiter state.
- The next production steps are containerized deployment, centralized audit logs,
  refresh-token rotation, metrics, tracing, backups, and load testing.

## Security Notes

- Patient enrollment is protected by default and requires an admin or registration worker.
- Passwords are hashed with bcrypt and are never returned by API responses.
- Patient routes apply both role checks and object-level ownership checks.
- The AI feature is an assistant, not a diagnostic authority; offline fallback is
  available when an API key is not configured.
- Demo credentials, if seeded locally, are for development only and must not be
  reused in a deployed environment.

## Development History

The repository history is intentionally incremental, with separate commits for
the API foundation, authentication, patient/clinical workflows, pharmacy
dispensing, AI architecture, frontend SPA, and infrastructure/documentation.
This makes design evolution and debugging decisions reviewable instead of hiding
everything in one initial commit.

## License

No open-source license has been declared yet. Add a license before accepting
external contributions or distributing the project publicly.
