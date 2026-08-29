# MedVault architecture (as implemented)

MedVault consists of a **FastAPI backend** and a **Vite + React 19 single-page frontend application**.

```text
       React 19 SPA (/frontend on port 5173)
       AuthContext (JWT in localStorage) + Typed Fetch Client
                         │
                         ▼
        HTTP + Bearer JWT + CORS Whitelist
                         │
                         ▼
             FastAPI app/main.py (port 8000)
             GET / → {"message": "Welcome to MedVault AI"}
                         │
         ┌───────────────┼───────────────┬─────────────────┐
         ▼               ▼               ▼                 ▼
      routers         services         app/ai           utils
      (HTTP)        inventory.py    context_builder    jwt, auth,
                    card_service.py provider/openai    roles,
                    (PDF/QR)        symptom_checker    authorization,
                                                       security
                         │               │
                         ▼               ▼
                 SQLAlchemy Session    OpenAI Chat Completions
                 get_db()              (only if OPENAI_API_KEY set)
                         │
                         ▼
                   PostgreSQL
                   (Alembic migrations)
```

---

## How this project uses layers

| Layer | In this repo | What it does | Talks to |
|---|---|---|---|
| **Frontend** | `frontend/src/` | Single Page App (React 19, TypeScript, Vanilla CSS design tokens, Lucide icons) | FastAPI backend via HTTP/CORS |
| **Routers** | `backend/app/routers/*.py` | HTTP paths, status codes, `Depends(get_db)`, `require_role` | Schemas in/out, models, services/AI |
| **Schemas** | `backend/app/schemas/*.py` | Pydantic request/response shapes | Routers only (not the DB) |
| **Models** | `backend/app/models/*.py` | SQLAlchemy tables and relationships | Session / PostgreSQL |
| **Services** | `backend/app/services/` | Logic reused by multiple routes: **dispense** and **card PDF/QR** | Models + HTTPException |
| **AI** | `backend/app/ai/` | Context string, prompts, OpenAI calls, keyword symptom rules | Routers, DB (context), OpenAI |
| **Utils** | `backend/app/utils/` | Password hash, JWT, `get_current_user`, RBAC, PHI object checks | Routers via Depends |
| **Database layer** | `database.py`, `dependencies.get_db`, Alembic | Engine, SessionLocal, `Base`, migrations | Postgres URL from env |
| **Config** | `backend/app/config.py` | Required env, CORS origins, stock thresholds, JWT extras | Imported at process start |

---

## Frontend Architecture

- **Path:** `/frontend`
- **Tooling:** Vite, TypeScript, React 19, React Router DOM, Lucide React.
- **Design System:** Custom CSS design tokens in `src/index.css` (cyber-medical dark theme, glassmorphism, responsive grid utilities).
- **State & Auth:** `AuthContext.tsx` handles token persistence, user profile caching from `GET /users/me`, and role-based route guarding via `ProtectedRoute.tsx`.
- **API Client:** `src/api/client.ts` centralizes API calls with automatic Bearer token injection and error message parsing.

---

## Authentication & Authorization

```text
POST /auth/login   (OAuth2PasswordRequestForm: username=email, password=…)
        ↓
verify bcrypt, user.is_active
        ↓
JWT { sub: email, role, exp }  HS256
        ↓
Authorization: Bearer …
        ↓
get_current_user (app/utils/auth.py)
        ↓
require_role([...])
```

Five roles: `admin`, `doctor`, `registration_worker`, `pharmacy`, `patient`.

---

## Database

Engine: `create_engine(DATABASE_URL, pool_pre_ping=True)`.  
Migrations: `backend/migrations/versions/` (Alembic stamped to `0002_fix_patient_column_types`).

```text
users 1──0..1 patients (patients.user_id unique, SET NULL on user delete)
patients 1──* medical_records (RESTRICT)
users 1──* medical_records.doctor_id (RESTRICT, nullable)
medical_records 1──* prescriptions (RESTRICT)
medicines 1──* prescriptions (RESTRICT)
users 1──* prescriptions.dispensed_by_user_id
prescriptions 1──0..1 inventory_movements (unique prescription_id)
medicines 1──* inventory_movements
users 1──* inventory_movements.performed_by_user_id
```

---

## Directory Structure

```text
MedVault/
├── README.md, project_context.md, ARCHITECTURE.md, DECISIONS.md,
│   CURRENT_STATE.md, TODO.md, GLOSSARY.md
├── project_status.md          → stub pointing at CURRENT_STATE.md
├── .gitignore
├── frontend/                  # Vite + React 19 + TypeScript SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── api/               # Typed fetch client
│       ├── components/        # Modals, Navbar, Sidebar, ProtectedRoute
│       ├── context/           # AuthContext
│       ├── pages/             # Doctor, Pharmacy, Registration, Patient, AI, Admin
│       └── types/             # Schema TypeScript contracts
└── backend/                   # FastAPI application
    ├── .env.example
    ├── OPERATIONS.md
    ├── alembic.ini
    ├── requirements.txt
    ├── app/
    │   ├── main.py            # App factory + CORS middleware
    │   ├── config.py          # Env & CORS configuration
    │   ├── database.py        # Engine, SessionLocal, Base
    │   ├── dependencies.py    # get_db
    │   ├── models/            # SQLAlchemy (full export in __init__.py)
    │   ├── schemas/           # Pydantic
    │   ├── routers/           # HTTP
    │   ├── services/          # inventory, cards
    │   ├── ai/
    │   └── utils/
    ├── migrations/
    └── tests/
```
