# MedVault TODO

Only items that apply to **this** repo. Not a generic engineering backlog.

---

## Critical

### First-admin bootstrap runbook
- **Status:** Completed — management helper added (`backend/app/manage.py`), docs in `backend/OPERATIONS.md`.

### Confirm / fix medical-records profile route shadowing
- **Status:** Completed — static profile route now resolves before the dynamic history route; regression test added.

---

## High Priority

### Frontend SPA & CORS Integration
- **What:** Modern client application to consume login, clinical workflows, and pharmacy queue with CORS.
- **Files:** `/frontend` directory, `backend/app/main.py`, `backend/app/config.py`
- **Status:** Completed — Vite + React 19 + TypeScript SPA with clinical workstation UI, AuthContext, ProtectedRoute, typed API client, service-worker shell, and offline drafts.

### Registration Worker Portal & Patient Identity System
- **What:** Beneficiary registration with Aadhaar validation, age/BMI metrics, dual-sided digital health card modal (PDF/QR downloads), and patient directory with demographic editor.
- **Files:** `frontend/src/pages/RegistrationPortal.tsx`, `frontend/src/components/BeneficiaryCardModal.tsx`, `frontend/src/components/EditPatientModal.tsx`
- **Status:** Completed.

### Run and extend regression tests
- **Status:** Completed — 14 backend tests passing and frontend production build verified.

### Patient enrollment auth policy
- **Status:** Completed — protected by default via `PROTECT_PATIENT_ENROLLMENT=true`; development can explicitly opt out.

---

## Medium Priority

### Doctor Clinical Portal Deep Workflows (Phase 1.3)
- **What:** Multi-tab encounter writer, structured prescription line-item builder with medicine catalog search dropdown, dosage calculation, and interactive longitudinal timeline.
- **Files:** `frontend/src/pages/DoctorPortal.tsx`
- **Status:** Partially complete — timeline and encounter workflow exist; structured medicine line items, alternatives, and repeat prescriptions remain open.

### Pharmacy Portal Deep Workflows (Phase 1.4)
- **What:** Live dispensing queue with batch actions, restock/adjustment modals, and movement history filter table.
- **Files:** `frontend/src/pages/PharmacyPortal.tsx`
- **Status:** Partially complete — queue, restock, movement history, and atomic dispense exist; batch actions and richer filters remain open.

### Unique constraint on `medicine_name`
- **What:** DB unique constraint to match `add_medicine` duplicate check.
- **Why:** Race: two POSTs can insert duplicates; app check is not serializable.
- **Dependencies:** Alembic revision.
- **Files:** `backend/app/models/medicine.py`, migrations
- **Status:** Completed — database constraint added in migration `0003_unique_medicine_name`.

### Deduplicate `get_db`
- **What:** One session dependency.
- **Why:** Two implementations can drift.
- **Files:** `app/dependencies.py`, `app/utils/auth.py`
- **Status:** Deferred — runtime routes use `get_async_db`; synchronous session remains for migrations/bootstrap/tests.

### Align role matrix
- **What:** Decide if `admin` may search patients; if patients may use timeline; document the matrix.
- **Files:** `patient.py`, `authorization.py`
- **Status:** Completed for patient search, create, and update (Admin included).

---

## Low Priority

### Lazy-load vs joinedload in `context_builder`
- **What:** Eager-load medicines for AI context.
- **Files:** `app/ai/context_builder.py`
- **Status:** Completed — async context builder eagerly loads prescribed medicines.

### Remove or fully hide deprecated `/pharmacy/dispense/{id}`
- **Files:** `app/routers/pharmacy.py`
- **Status:** Deferred compatibility alias — marked deprecated and retained for existing clients.

---

## Future / Ideas

- RAG / vector “health memory” (advertised, **not built**)
- Docker / production hosting
- Full-system audit logs beyond inventory
- Native mobile apps
- Offline-first production sync beyond clinical drafts
- Load testing and outage simulation
