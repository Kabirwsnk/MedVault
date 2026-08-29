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
- **Status:** Completed — Vite + React 19 + TypeScript SPA built with dark cyber-medical theme, AuthContext, ProtectedRoute, and typed API client.

### Registration Worker Portal & Patient Identity System
- **What:** Beneficiary registration with Aadhaar validation, age/BMI metrics, dual-sided digital health card modal (PDF/QR downloads), and patient directory with demographic editor.
- **Files:** `frontend/src/pages/RegistrationPortal.tsx`, `frontend/src/components/BeneficiaryCardModal.tsx`, `frontend/src/components/EditPatientModal.tsx`
- **Status:** Completed.

### Run and extend regression tests
- **Status:** Completed — 10 unit tests passing in `backend/tests/` and frontend production build verified.

### Patient enrollment auth policy
- **Status:** Completed — opt-in protection implemented via `PROTECT_PATIENT_ENROLLMENT` env var (staff can enroll when enabled).

---

## Medium Priority

### Doctor Clinical Portal Deep Workflows (Phase 1.3)
- **What:** Multi-tab encounter writer, structured prescription line-item builder with medicine catalog search dropdown, dosage calculation, and interactive longitudinal timeline.
- **Files:** `frontend/src/pages/DoctorPortal.tsx`
- **Status:** Open (Next up)

### Pharmacy Portal Deep Workflows (Phase 1.4)
- **What:** Live dispensing queue with batch actions, restock/adjustment modals, and movement history filter table.
- **Files:** `frontend/src/pages/PharmacyPortal.tsx`
- **Status:** Open

### Unique constraint on `medicine_name`
- **What:** DB unique constraint to match `add_medicine` duplicate check.
- **Why:** Race: two POSTs can insert duplicates; app check is not serializable.
- **Dependencies:** Alembic revision.
- **Files:** `backend/app/models/medicine.py`, migrations
- **Status:** Open

### Deduplicate `get_db`
- **What:** One session dependency.
- **Why:** Two implementations can drift.
- **Files:** `app/dependencies.py`, `app/utils/auth.py`
- **Status:** Open

### Align role matrix
- **What:** Decide if `admin` may search patients; if patients may use timeline; document the matrix.
- **Files:** `patient.py`, `authorization.py`
- **Status:** Completed for patient search, create, and update (Admin included).

---

## Low Priority

### Lazy-load vs joinedload in `context_builder`
- **What:** Eager-load medicines for AI context.
- **Files:** `app/ai/context_builder.py`
- **Status:** Open

### Remove or fully hide deprecated `/pharmacy/dispense/{id}`
- **Files:** `app/routers/pharmacy.py`
- **Status:** Open

---

## Future / Ideas

- RAG / vector “health memory” (advertised, **not built**)
- Docker / production hosting
- Full-system audit logs beyond inventory
- Native mobile apps
