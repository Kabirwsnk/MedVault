# Current state

**Question this file answers:** where is MedVault **right now**?

Last local commits: `37b9fb8` docs update, `b76e916` architecture sync, `b36a320` UI redesign, `090c8b2` offline drafts.  
Remote: local `main` is in sync with `origin/main`.  
Ignored local files include `backend/.env`, virtual environments, build output, and archives.

---

### Completed

Code exists for the following:

- **Frontend Application (`/frontend`):**
  - Modern Single Page Application (Vite + React 19 + TypeScript + Vanilla CSS design tokens).
  - Neutral clinical workstation UI with restrained tables, forms, status labels, and Lucide icons.
  - Typed API client (`src/api/client.ts`) with automatic JWT injection, error mapping, and 401 interceptor.
  - Global `AuthContext` with login, logout, role helpers, and test presets.
  - Online/offline/server health indicator, service-worker shell, and IndexedDB clinical drafts.
  - Dual-sided interactive Beneficiary Card modal (`BeneficiaryCardModal.tsx`) with scannable QR token and one-click PDF card downloads.
  - Beneficiary Registration Station (`RegistrationPortal.tsx`) with auto-spaced 12-digit Aadhaar formatting, live Age calculation, and BMI classification.
  - Searchable Beneficiary Directory with demographic editor modal (`EditPatientModal.tsx` & `PUT /patients/{id}`).
  - Clinical stations: Doctor Portal (encounters & timeline), Pharmacy Portal (queue & atomic dispense), Patient Portal (personal health vault), AI Clinical Assistant, and Admin Staff Provisioning.
- **Backend API & CORS (`backend/app/`):**
  - FastAPI app with configured `CORSMiddleware` supporting environment origins (`CORS_ORIGINS`).
  - JWT login, staff register (admin), patient enrollment (`/auth/patient-enrollment`).
  - Role constants + DB role CHECK + `require_role` across all 5 roles (`admin`, `doctor`, `registration_worker`, `pharmacy`, `patient`).
  - Full model registry export in `app/models/__init__.py`.
  - Object-level patient access on listed patient/AI/card/profile routes.
  - Patient create (Beneficiary ID + Aadhaar uniqueness + PostgreSQL advisory lock `260001`), list, search, get, update.
  - Patient profile (`GET /patients/profile/{id}`).
  - Doctor timeline (`GET /patients/timeline/{beneficiary_id}`).
  - Medical record create/history/update with authorship rule.
  - Medicine CRUD: add, list, get, update, restock, low-stock, critical-stock.
  - Inventory movement rows for dispense/restock/adjustment + history endpoint.
  - Prescription create, list, details, dispense, dispensed history.
  - Doctor dashboard stats + recent patients/records.
  - Pharmacy dashboard stats.
  - Patient dashboard (own ID).
  - Beneficiary card JSON, QR PNG, PDF generation.
  - AI symptom checker, chat, summary (OpenAI or offline fallback text).
  - Login rate limiting with configurable memory or Redis storage.
  - Database health endpoint, safe API timeouts/retries, and idempotent encounter replay.
  - Admin bootstrap CLI + docs (`backend/app/manage.py`, `backend/OPERATIONS.md`).
  - Full regression test suite passing (14 tests).

---

### In Progress / Up Next

- Structured prescription line-item builder with medicine strengths, brands, alternatives, and repeat-previous-prescription support.
- Pharmacy batch workflows and richer movement filters.
- Broader offline drafting and conflict-resolution UX.

---

### Not Started

- RAG / vector health memory (currently string context builder)
- Docker / production deploy scripts
- General audit log (beyond `inventory_movements`)
- Refresh tokens / OAuth social login
- Full production observability and load testing

---

### Current Architecture Status

**Stable, integrated frontend + backend.** Async API/session migration is complete and Alembic head is `0004_idempotency_records`. Backend CORS is wired to the Vite frontend client. Offline support is limited to app-shell loading and clinical drafts; final identity and inventory transactions remain server-authoritative.

---

### Current Environment

| Item | Value |
|---|---|
| OS (this workspace) | Windows |
| Branch | `main` |
| Python environment | `backend\venv\Scripts\python.exe` |
| Node environment | Node v25.2.1, npm 11.6.2 |
| Frontend dev server | `http://localhost:5173` |
| Backend API server | `http://localhost:8000` |
| Postgres DB | Reconciled & running locally with seeded test accounts |

---

### Last Successfully Tested

- **Frontend build:** `cd frontend; npm run build` &rarr; production build passes.
- **Backend test suite:** `cd backend; .\venv\Scripts\python.exe -m unittest discover -s tests` &rarr; `Ran 14 tests — OK`.
- **Health check:** `GET http://127.0.0.1:8000/health` &rarr; database available.
- **Live Auth Integration:** `POST http://127.0.0.1:8000/auth/login` &rarr; `HTTP 200 OK` with valid JWT token.

---

### Do Not Change Casually

- `dispense_prescription` locking and movement uniqueness
- Beneficiary ID generation + lock `260001`
- `require_patient_access` and role CHECK
- Env-required `DATABASE_URL` / `JWT_SECRET_KEY`
- Alembic chain; patient DOB vs blood_group types; idempotency migration
- Route ordering on patients/medicines/prescriptions
