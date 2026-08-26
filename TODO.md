# MedVault TODO

Only items that apply to **this** repo. Not a generic engineering backlog.

---

## Critical

### First-admin bootstrap runbook

- **What:** Define and document how the first `admin` account is created in a fresh DB.
- **Why:** `POST /auth/register` requires an existing admin; onboarding is blocked without a bootstrap method.
- **Dependencies:** Product/security decision.
- **Files:** `backend/app/routers/auth.py`, `backend/OPERATIONS.md`, `README.md`, `project_context.md`
- **Status:** Open (**UNKNOWN / NEEDS CONFIRMATION**)

### Confirm / fix medical-records profile route shadowing

- **What:** Move `GET /medical-records/profile/{beneficiary_id}` above `GET /{beneficiary_id}`, or remove it and keep `/patients/profile/...` as the only profile.
- **Why:** Dead or misleading endpoint.
- **Dependencies:** None.
- **Files:** `backend/app/routers/medical_record.py`
- **Status:** Open (confirmed by route declaration order in code)

---

## High Priority

### Run and extend regression tests

- **What:** Keep `unittest` green; finish `test_inventory_movements_history` assertions; add cases for double-dispense 409, enrollment, card JSON 403.
- **Why:** PHI and stock bugs are expensive.
- **Dependencies:** None (baseline run already works from `backend\venv\Scripts\python.exe`).
- **Files:** `backend/tests/test_security_and_dispensing.py`
- **Status:** Open

### First UI against existing API

- **What:** A real client (not specified — **Not explicitly decided**: React vs other). Consume login + one role flow.
- **Why:** Portals are advertised; only Swagger exists.
- **Dependencies:** CORS will be required if the UI is another origin (`main.py` has none today).
- **Files:** new frontend (does not exist); possibly `main.py`
- **Status:** Not started

### Patient enrollment auth policy

- **What:** Decide whether unauthenticated enrollment is intentional; if not, protect it.
- **Why:** Anyone who can guess/obtain a Beneficiary ID may bind an account if `user_id` is null.
- **Dependencies:** Product decision.
- **Files:** `backend/app/routers/auth.py`
- **Status:** Open — policy **UNKNOWN / NEEDS CONFIRMATION**

---

## Medium Priority

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
- **Why:** Easy to ship accidental 403/200 differences.
- **Files:** `patient.py`, `authorization.py`
- **Status:** Open

### QR payload / “verified” claim

- **What:** Reduce PII in QR or sign it; `verified: true` is not proof.
- **Why:** Cards are printable identity documents.
- **Files:** `patient.py`, `card_service.py`
- **Status:** Open

### Pre-Alembic database reconciliation (if an old DB still exists)

- **What:** Backup + comparison before stamp (`OPERATIONS.md`).
- **Why:** Missing authorship/inventory columns.
- **Files:** `backend/OPERATIONS.md`, migrations
- **Status:** Open **if** a legacy DB is in use — UNKNOWN here

---

## Low Priority

### Lazy-load vs joinedload in `context_builder`

- **What:** Eager-load medicines for AI context.
- **Why:** Extra queries; possible lazy-load issues if session closes early.
- **Files:** `app/ai/context_builder.py`
- **Status:** Open

### Remove or fully hide deprecated `/pharmacy/dispense/{id}`

- **What:** After no clients use it, drop the route.
- **Why:** Two URLs for one action.
- **Files:** `app/routers/pharmacy.py`
- **Status:** Open — clients **UNKNOWN**

### Symptom checker: clarify it is a demo

- **What:** Naming/docs only unless product wants a real model.
- **Files:** `app/ai/symptom_checker.py`, `app/routers/ai.py`
- **Status:** Open

---

## Future / Ideas

Do **not** start these while first-admin bootstrap, route correctness, and core tests are unfinished.

- RAG / vector “health memory” (advertised, **not built**)
- Docker / production hosting (**Not explicitly decided**)
- Full-system audit logs beyond inventory
- Native mobile apps
- Replacing FastAPI/Postgres/JWT
- Expanding OpenAI to other providers (`provider.py` would need real branches)

---

## Recently completed (do not re-open as “next feature”)

These were “next” in old `project_context.md` and **are already in code**:

- Beneficiary card JSON
- QR + PDF generation
- Patient dashboard / patient login-enrollment
- Inventory movements
- AI summary/chat routes (with offline fallback)
