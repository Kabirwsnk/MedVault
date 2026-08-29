# Current state

**Question this file answers:** where is MedVault **right now**?

Last git commit on `main` (workspace): `9b1f03f` — *Chunk 1A: beneficiary ID generation and configuration fixes*.  
Remote: `origin/main` up to date.  
Untracked: `backend.zip` (not application source).

---

### Completed

Code exists for the following:

- **Frontend Application (`/frontend`):**
  - Modern Single Page Application (Vite + React 19 + TypeScript + Vanilla CSS design tokens).
  - Cyber-medical dark theme with glassmorphism, responsive telemetry cards, and Lucide icons.
  - Typed API client (`src/api/client.ts`) with automatic JWT injection, error mapping, and 401 interceptor.
  - Global `AuthContext` with login, logout, role helpers, and test presets.
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
  - Admin bootstrap CLI + docs (`backend/app/manage.py`, `backend/OPERATIONS.md`).
  - Full regression test suite passing (10 tests).

---

### In Progress / Up Next

- Phase 1.3: Deep Doctor Clinical Portal (Multi-tab encounter writer, structured prescription line-item builder with medicine search dropdown + dosage calculation, interactive longitudinal timeline).
- Phase 1.4: Deep Pharmacy Portal (Batch dispensing, stock adjustment logging, movement history filters).
- Phase 1.5: Deep Patient Health Wallet (Medication reminders, full diagnostic history).

---

### Not Started

- RAG / vector health memory (currently string context builder)
- Docker / production deploy scripts
- General audit log (beyond `inventory_movements`)
- Refresh tokens / OAuth social login
- Unique DB constraint on `medicine_name` (app-level check only)

---

### Current Architecture Status

**Stable, integrated frontend + backend.** Database schema reconciled and Alembic stamped to `head` (`0002_fix_patient_column_types`). Backend CORS is fully wired to the Vite frontend client.

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

- **Frontend build:** `cd frontend; npm run build` &rarr; `✓ 1849 modules transformed, dist/ created cleanly in 3.32s with 0 errors`.
- **Backend test suite:** `cd backend; .\venv\Scripts\python.exe -m unittest discover -s tests` &rarr; `Ran 10 tests — OK`.
- **Live Auth Integration:** `POST http://127.0.0.1:8000/auth/login` &rarr; `HTTP 200 OK` with valid JWT token.

---

### Do Not Change Casually

- `dispense_prescription` locking and movement uniqueness
- Beneficiary ID generation + lock `260001`
- `require_patient_access` and role CHECK
- Env-required `DATABASE_URL` / `JWT_SECRET_KEY`
- Alembic chain; patient DOB vs blood_group types
- Route ordering on patients/medicines/prescriptions
