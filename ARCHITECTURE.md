# MedVault architecture (as implemented)

There is **no frontend application** in this repository.

```text
  HTTP client (browser Swagger, curl, TestClient)
                    │
                    ▼
         FastAPI  app/main.py
         GET /  → {"message": "Welcome to MedVault AI"}
                    │
        ┌───────────┼───────────────┬─────────────────┐
        ▼           ▼               ▼                 ▼
     routers     services         app/ai           utils
     (HTTP)    inventory.py    context_builder    jwt, auth,
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

Typical clinical request:

```text
Doctor UI (does not exist here)
        ↓
Page / client (N/A)
        ↓
HTTP + Bearer JWT
        ↓
Router (e.g. medical_record.py)
        ↓
SQLAlchemy model query
        ↓
PostgreSQL table medical_records
```

Pharmacy dispense:

```text
POST /prescriptions/{id}/dispense
        ↓
inventory.dispense_prescription()
        ↓
lock prescription + medicine rows
        ↓
stock -= qty; dispensed=true; insert inventory_movements
        ↓
commit
```

AI summary:

```text
GET /ai/summary/{beneficiary_id}
        ↓
require_role + require_patient_access
        ↓
build_patient_context(db)  → string from SQL
        ↓
summarize_ai() → OpenAI or offline placeholder
```

---

## How this project uses layers

These are **not** generic textbook definitions; they match MedVault’s folders.

| Layer | In this repo | What it does | Talks to |
|---|---|---|---|
| **Routers** | `app/routers/*.py` | HTTP paths, status codes, `Depends(get_db)`, `require_role` | Schemas in/out, models, sometimes services/AI |
| **Schemas** | `app/schemas/*.py` | Pydantic request/response shapes | Routers only (not the DB) |
| **Models** | `app/models/*.py` | SQLAlchemy tables and relationships | Session / PostgreSQL |
| **Services** | `app/services/` | Logic reused by multiple routes: **dispense** and **card PDF/QR** | Models + HTTPException |
| **AI** | `app/ai/` | Context string, prompts, OpenAI calls, keyword symptom rules | Routers, DB (context), OpenAI |
| **Utils** | `app/utils/` | Password hash, JWT, `get_current_user`, RBAC, PHI object checks | Routers via Depends |
| **Database layer** | `database.py`, `dependencies.get_db`, Alembic | Engine, SessionLocal, `Base`, migrations | Postgres URL from env |
| **Config** | `app/config.py` | Required env, stock thresholds, JWT extras | Imported at process start |

Most CRUD still lives **in routers**, not in a service layer. Only dispensing and cards were extracted.

---

## Frontend

**None.** No `package.json`, no templates. Interactive docs: Swagger at `/docs` when Uvicorn is running.

---

## Backend

- Entry: `backend/app/main.py` — creates `FastAPI()`, includes routers, **does not** create tables.
- Config: `backend/app/config.py` — fails fast if `DATABASE_URL` or `JWT_SECRET_KEY` missing.
- App package imports assume cwd/`PYTHONPATH` is `backend/` (`from app....`). Historical bug: `from backend.app....` caused `ModuleNotFoundError`.

---

## Authentication

```text
POST /auth/login   (OAuth2PasswordRequestForm: username=email, password=…)
        ↓
verify bcrypt, user.is_active
        ↓
JWT { sub: email, role, exp }  HS256
        ↓
Authorization: Bearer …
        ↓
get_current_user (app/utils/auth.py)  OAuth2 tokenUrl="auth/login"
        ↓
require_role([...])
```

No refresh tokens, no API keys for users.

Staff create: `POST /auth/register` — **admin only**.

Patient user: `POST /auth/patient-enrollment` — **no JWT** in the handler; anyone who knows a not-yet-linked `beneficiary_id` can enroll. (Security implication; not redesigned here.)

---

## APIs / routes

Prefix as in code. Auth: JWT unless noted.

### Root

| Method | Path | Auth |
|---|---|---|
| GET | `/` | none |

### Auth `/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | admin | Staff roles only |
| POST | `/auth/patient-enrollment` | none | Links patient ↔ user |
| POST | `/auth/login` | none | Form body |

### Users `/users`

| Method | Path | Auth |
|---|---|---|
| GET | `/users/me` | any logged-in user |

### Patients `/patients`

| Method | Path | Roles (as coded) |
|---|---|---|
| GET | `/patients/` | doctor, registration_worker, admin |
| GET | `/patients/search?name=` | doctor, registration_worker |
| POST | `/patients/` | registration_worker |
| GET | `/patients/card/{beneficiary_id}` | doctor, registration_worker, patient, admin + object check |
| GET | `/patients/card/{beneficiary_id}/qr` | same |
| GET | `/patients/card/{beneficiary_id}/pdf` | same |
| GET | `/patients/profile/{beneficiary_id}` | doctor, patient, admin + clinical object check |
| GET | `/patients/timeline/{beneficiary_id}` | doctor |
| GET | `/patients/{beneficiary_id}` | doctor, registration_worker, patient, admin + demographic object check |
| PUT | `/patients/{beneficiary_id}` | doctor, registration_worker |

`GET /patients/all` was **removed** (comment in `patient.py`); use `GET /patients/`.

### Medical records `/medical-records`

| Method | Path | Roles |
|---|---|---|
| POST | `/medical-records/{beneficiary_id}` | doctor |
| GET | `/medical-records/{beneficiary_id}` | doctor |
| GET | `/medical-records/profile/{beneficiary_id}` | doctor — **likely shadowed**; see CURRENT_STATE |
| PUT | `/medical-records/{record_id}` | doctor (must be author if `doctor_id` set) or admin |

### Medicines `/medicines`

| Method | Path | Roles |
|---|---|---|
| POST | `/medicines/` | pharmacy, admin |
| GET | `/medicines/` | doctor, pharmacy, admin |
| GET | `/medicines/low-stock` | doctor, pharmacy, admin |
| GET | `/medicines/critical-stock` | pharmacy, admin |
| GET | `/medicines/movements/history` | pharmacy, doctor, admin |
| PUT | `/medicines/{id}/restock` | pharmacy, admin |
| GET | `/medicines/{id}` | doctor, pharmacy, admin |
| PUT | `/medicines/{id}` | pharmacy, admin (may write `adjustment` movement) |

### Prescriptions `/prescriptions`

| Method | Path | Roles |
|---|---|---|
| POST | `/prescriptions/{medical_record_id}` | doctor |
| GET | `/prescriptions/dispensed/history` | doctor, pharmacy |
| GET | `/prescriptions/details/{prescription_id}` | doctor, pharmacy |
| GET | `/prescriptions/` | doctor, pharmacy |
| POST | `/prescriptions/{prescription_id}/dispense` | pharmacy |

### Pharmacy `/pharmacy` (legacy)

| Method | Path | Notes |
|---|---|---|
| POST | `/pharmacy/dispense/{prescription_id}` | deprecated; same service as above |

### Dashboards

| Method | Path | Roles |
|---|---|---|
| GET | `/dashboard/stats` | doctor |
| GET | `/dashboard/recent-patients` | doctor |
| GET | `/dashboard/recent-records` | doctor |
| GET | `/pharmacy-dashboard/stats` | pharmacy |
| GET | `/patient-dashboard/{beneficiary_id}` | patient; must match `current_user.patient` |

### AI `/ai`

| Method | Path | Auth |
|---|---|---|
| GET | `/ai/` | none |
| GET | `/ai/symptom-checker?symptoms=` | doctor, patient, admin |
| GET | `/ai/chat?beneficiary_id=&question=` | doctor, patient, admin + patient object check |
| GET | `/ai/summary/{beneficiary_id}` | doctor, patient, admin + patient object check |

---

## Database

Engine: `create_engine(DATABASE_URL, pool_pre_ping=True)`.

Migrations: `backend/migrations/versions/`

- `0001_baseline_schema` — `Base.metadata.create_all`
- `0002_fix_patient_column_types` — swap `blood_group` (was DATE) and `date_of_birth` (was VARCHAR) to String/Date

### Tables / models

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

**users:** id, email unique, password hash, role, is_active, timestamps. Role CHECK: admin|doctor|registration_worker|pharmacy|patient.

**patients:** id, beneficiary_id unique, full_name, phone_number, aadhar_number unique, user_id, blood_group, date_of_birth, gender, height_cm, weight_kg, emergency_contact, timestamps. CHECKs: height/weight positive if set.

**medical_records:** id, patient_id, doctor_id, diagnosis, prescription (text), notes, timestamps.

**medicines:** id, medicine_name, manufacturer, unit, stock ≥ 0, timestamps. **No unique constraint on medicine_name in the model**; duplicate names are rejected only in `add_medicine` query logic.

**prescriptions:** id, medical_record_id, medicine_id, quantity > 0, dosage, duration, dispensed, dispensed_at, dispensed_by_user_id, created_at.

**inventory_movements:** id, medicine_id, prescription_id nullable unique, performed_by_user_id, movement_type, quantity ≠ 0, stock_before, stock_after, notes, created_at. Types written in code: `dispense`, `restock`, `adjustment`.

---

## External services

| Service | Role |
|---|---|
| PostgreSQL | System of record |
| OpenAI | Optional chat/summary; model `gpt-4.1-mini` in `app/ai/config.py` |
| None other | No S3, no Redis, no email, no SMS |

File/document storage: **none**. PDF/QR are generated in memory (`card_service.py`) and returned as HTTP bodies.

---

## AI / LLM components

| File | What | Why | Communicates with |
|---|---|---|---|
| `ai/config.py` | Provider name, model, temperature, max_tokens | Central AI knobs | provider/openai_service |
| `ai/provider.py` | `ask_ai` / `summarize_ai` | Swap provider without rewriting routers | openai_service |
| `ai/openai_service.py` | Chat Completions or offline strings | Live LLM vs demo without key | OpenAI HTTP API |
| `ai/prompts.py` | System/summary prompt text | Safety/education wording | openai_service |
| `ai/context_builder.py` | Concatenate patient + records + Rx | Grounding for LLM | SQLAlchemy Patient/MedicalRecord/Prescription |
| `ai/symptom_checker.py` | Keyword rules | Demo endpoint; **not** LLM | `ai` router only |

`AI_PROVIDER` is hard-coded `"openai"`. Other providers raise `ValueError`.

---

## Important dependencies (`requirements.txt`)

Runtime highlights: fastapi, uvicorn, sqlalchemy, pydantic, alembic, psycopg2-binary, python-jose, passlib, bcrypt, python-dotenv, openai, httpx, qrcode, pillow, reportlab, email-validator.

---

## Directory structure

```text
MedVault/
├── README.md, project_context.md, ARCHITECTURE.md, DECISIONS.md,
│   CURRENT_STATE.md, TODO.md, GLOSSARY.md
├── project_status.md          → stub pointing at CURRENT_STATE.md
├── .gitignore
├── backend.zip                (untracked archive; not part of the app)
└── backend/
    ├── .env.example
    ├── OPERATIONS.md
    ├── alembic.ini
    ├── requirements.txt
    ├── app/
    │   ├── main.py            # app factory / router includes
    │   ├── config.py          # env
    │   ├── database.py        # engine, SessionLocal, Base
    │   ├── dependencies.py    # get_db
    │   ├── models/            # SQLAlchemy
    │   ├── schemas/           # Pydantic
    │   ├── routers/           # HTTP
    │   ├── services/          # inventory, cards
    │   ├── ai/
    │   └── utils/
    ├── migrations/
    └── tests/
```

### Important files (purpose → dependents)

| File | Purpose | What depends on it |
|---|---|---|
| `app/main.py` | Wires routers | Uvicorn, tests importing `app` |
| `app/config.py` | Required settings | database, jwt, medicine thresholds |
| `app/database.py` | Engine/Base | all models, migrations env, get_db |
| `app/models/*.py` | Tables | routers, services, Alembic, tests |
| `app/services/inventory.py` | Atomic dispense | `prescription` + `pharmacy` routers, tests |
| `app/services/card_service.py` | QR/PDF bytes | `patient` router, tests |
| `app/utils/auth.py` | JWT user | `require_role`, `/users/me` |
| `app/utils/authorization.py` | PHI object ACL | patient + AI routers |
| `app/utils/roles.py` | Role names + RBAC Depends | almost all routers |
| `migrations/env.py` | Alembic URL + metadata | `alembic upgrade` |

---

## Data flow notes

- `joinedload` is used on timeline, patient dashboard, and card JSON to avoid N+1 on nested prescriptions.
- `context_builder` does **not** `joinedload` medicines; it uses lazy `prescription.medicine` (works on an open session; extra queries).
- `get_current_user` does not `joinedload(User.patient)`; patient dashboard uses `current_user.patient` (lazy load).
