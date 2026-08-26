# MedVault

**Your Health. Secured Forever.**

MedVault is a **backend-first healthcare API**. It stores patient identity and clinical data around a unique **Beneficiary ID**, and exposes role-protected REST endpoints for registration workers, doctors, pharmacy staff, patients, and admins.

This repository **does not contain a frontend**. The working UI for development is FastAPI’s Swagger UI.

Repository: [https://github.com/Kabirwsnk/MedVault.git](https://github.com/Kabirwsnk/MedVault.git)

---

## Problem it solves

Healthcare data for a patient is often split across clinics, doctors, and pharmacies. MedVault gives each registered person one Beneficiary ID and a server-side record of:

- Demographics
- Medical encounter notes
- Structured prescriptions
- Pharmacy dispensing and stock movement
- A printable / scannable beneficiary card

---

## Target users (roles in the API)

| Role | What they do in the current API |
|---|---|
| `registration_worker` | Register patients, search, update demographics, view cards |
| `doctor` | Clinical records, prescriptions, doctor dashboard, timeline, AI endpoints |
| `pharmacy` | Medicines, restock, dispense, pharmacy dashboard |
| `patient` | Own profile, own dashboard, own card (after enrollment) |
| `admin` | Staff user registration and several elevated reads/writes |

---

## Current purpose

Operate a **PostgreSQL-backed FastAPI service** that enforces JWT + role checks, object-level patient access where implemented, and an atomic pharmacy dispense path.

---

## Core features currently implemented (API)

- JWT login; staff registration (admin-only); patient account enrollment
- Patient CRUD/search, profile, doctor timeline
- Medical records (create, history, authorship-restricted update)
- Medicine catalog, low/critical stock, restock, stock adjustment audit
- Prescriptions and pharmacy dispensing with inventory movements
- Doctor dashboard and pharmacy dashboard
- Patient dashboard (own Beneficiary ID only)
- Beneficiary card JSON, QR PNG, and PDF
- AI module: rule-based symptom checker; patient-context chat/summary via OpenAI **or** an offline fallback if no API key

**Not implemented:** a web/mobile app, RAG / vector “health memory”, deployment pipeline, first-admin bootstrap endpoint.

---

## Planned / advertised (not built)

The GitHub description and older README mention RAG-based health memory and a full multi-portal product. **RAG is not in this codebase.** Portals exist only as backend routes, not as UIs.

See `project_context.md` (future plans) and `TODO.md`.

---

## Technology stack

| Layer | Choice |
|---|---|
| API | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.x |
| Validation | Pydantic v2 |
| Database | PostgreSQL (tests use SQLite) |
| Migrations | Alembic |
| Auth | JWT (`python-jose`, HS256), OAuth2 password form |
| Passwords | Passlib + bcrypt |
| AI | Optional OpenAI client; provider abstraction in `app/ai/` |
| Cards | `qrcode`, Pillow, ReportLab |

---

## High-level structure

```text
HTTP client / Swagger
        ↓
FastAPI (backend/app/main.py)
        ↓
Routers → services / AI / auth utils
        ↓
SQLAlchemy session
        ↓
PostgreSQL
        ↘ optional OpenAI API
```

Details: `ARCHITECTURE.md`.

---

## Run locally

Prerequisites: Python 3, PostgreSQL, a virtualenv.

```text
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # then edit .env
alembic -c alembic.ini upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open:

- API root: `http://localhost:8000/`
- Swagger: `http://localhost:8000/docs`

Regression tests (from `backend/`, with dependencies installed):

```text
python -m unittest discover -s tests
```

Full operational notes (including **do not blindly stamp** an old pre-Alembic database): `backend/OPERATIONS.md`.

### First admin user — UNKNOWN / NEEDS CONFIRMATION

`POST /auth/register` requires an existing `admin`. This repo has **no seed script**. How the first admin is created in a real database is not documented in code.

---

## Environment variables

Copy `backend/.env.example`. **Never commit `.env` or real secrets.**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy URL (example uses `postgresql+psycopg2://…`) |
| `JWT_SECRET_KEY` | Signing key for access tokens |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (default 60) |
| `LOW_STOCK_THRESHOLD` | Stock count treated as “low” (default 20) |
| `CRITICAL_STOCK_THRESHOLD` | Stock count treated as “critical” (default 10) |
| `OPENAI_API_KEY` | Optional. Empty → AI chat/summary use offline placeholder text |

`JWT_ALGORITHM` is hard-coded as `HS256` in `app/config.py`, not an env var.

---

## Current project status

Backend feature set on `main` is substantial (patients, clinical data, pharmacy, cards, AI routes). There is **no frontend**. In this documentation pass, backend regression tests were run successfully from `backend/` using `venv\Scripts\python.exe -m unittest discover -s tests` (6 tests passed). The run emitted SQLite resource warnings after completion.

Authoritative snapshots:

| File | Use |
|---|---|
| `project_context.md` | Long-term memory for humans and AI agents |
| `ARCHITECTURE.md` | How the code is wired |
| `DECISIONS.md` | What was chosen and why |
| `CURRENT_STATE.md` | Where work stands **right now** |
| `TODO.md` | Task list |
| `GLOSSARY.md` | Domain terms |
| `backend/OPERATIONS.md` | Run/migrate/test operations |

---

## Documentation for AI handoffs

Start a new coding-agent chat with: **read `project_context.md` first**, then `CURRENT_STATE.md` and `ARCHITECTURE.md` as needed. Do not trust older `project_status.md` content if it disagrees with those files.
