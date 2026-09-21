# MedVault — project context (AI / human long-term memory)

This is the **canonical** project memory. Older `project_context.md` dumps and `project_status.md` checklists were stale. **Prefer this file.**

Read map:

| Need | File |
|---|---|
| What/why/constraints | this file |
| How it is built | `ARCHITECTURE.md` |
| Why a technology exists | `DECISIONS.md` |
| Where work is today | `CURRENT_STATE.md` |
| What to do next | `TODO.md` |
| Terms | `GLOSSARY.md` |
| How to run/migrate | `README.md`, `backend/OPERATIONS.md` |

---

## CURRENT REALITY

### What MedVault is

A **FastAPI + PostgreSQL** healthcare backend coupled with a **Vite + React 19 + TypeScript** frontend application. Product name: “MedVault AI”. GitHub: https://github.com/Kabirwsnk/MedVault.git

### Why it exists

Provide each person with a unique **Beneficiary ID** and allow clinic staff (registration workers, doctors, pharmacists, admins, and patients) to securely share identity, encounter notes, prescriptions, and inventory movements.

### Users

API roles (`app/utils/roles.py`, DB check constraint): `admin`, `doctor`, `registration_worker`, `pharmacy`, `patient`.

### Current scope (implemented)

* **Frontend SPA (`/frontend`):** Vite + React 19 + TypeScript single-page app with a neutral clinical workstation UI, global AuthContext, role guards, dual-sided digital Beneficiary Cards, Beneficiary Intake Form, search directory, connection health indicator, service-worker shell, and IndexedDB clinical drafts.
* **Backend API (`/backend`):** Async FastAPI application with configured `CORSMiddleware`, PostgreSQL datastore, Alembic migrations through `0004_idempotency_records`, JWT authentication, advisory lock Beneficiary ID minting (`260001`), atomic pharmacy dispensing with row locks, inventory movement audit logs, health checks, rate limiting, and idempotent encounter replay.

### Technology stack

* **Frontend:** React 19, TypeScript, Vite, React Router DOM, Lucide React, Custom CSS design tokens.
* **Backend:** FastAPI, Uvicorn, SQLAlchemy 2.x, Pydantic v2, PostgreSQL + psycopg2, Alembic, JWT HS256, Passlib bcrypt, python-jose, OpenAI SDK (optional), qrcode, Pillow, ReportLab.

---

## FUTURE PLANS

* **Doctor Clinical Portal Deep Workflows:** Multi-tab encounter writer, structured prescription line-item builder with medicine search dropdown + dosage calculation, and interactive longitudinal timeline.
* **Pharmacy Deep Workflows:** Live dispensing queue with batch actions, restock/adjustment modals, and movement history filter table.
* **Patient Health Wallet:** Medication reminders, full diagnostic history, and vector health memory.
* **Production Deployment:** Docker / multi-container setup with automated migrations.
