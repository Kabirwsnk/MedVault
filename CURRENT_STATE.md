# Current state

**Question this file answers:** where is MedVault **right now**?

Last git commit on `main` (workspace): `9b1f03f` — *Chunk 1A: beneficiary ID generation and configuration fixes*.  
Remote: `origin/main` up to date.  
Untracked: `backend.zip` (not application source).

---

### Completed

Code exists for the following. Treat as **implemented in the backend**, not as a verified production deployment.

- FastAPI app + Swagger
- JWT login, staff register (admin), patient enrollment
- Role constants + DB role CHECK + `require_role`
- Object-level patient access on listed patient/AI/card/profile routes
- Patient create (Beneficiary ID + Aadhaar uniqueness + advisory lock), list, search, get, update
- Patient profile (`GET /patients/profile/{id}`)
- Doctor timeline
- Medical record create/history/update with authorship rule
- Medicine CRUD-ish: add, list, get, update, restock, low-stock, critical-stock
- Inventory movement rows for dispense/restock/adjustment + history endpoint
- Prescription create, list, details, dispense, dispensed history
- Deprecated pharmacy dispense wrapper
- Doctor dashboard stats + recent patients/records
- Pharmacy dashboard stats
- Patient dashboard (own ID)
- Beneficiary card JSON, QR PNG, PDF
- AI home, keyword symptom checker, chat, summary (OpenAI or offline text)
- Alembic baseline + patient column-type fix
- Unit tests for: unauthenticated list 401, patient 403/200, one inventory movement on dispense, authorship 403/200, AI home/symptom/summary, card QR/PDF

---

### In Progress

Nothing in the repo is marked WIP (no TODO comments, no open feature flags).

---

### Not Started

- Any frontend / portal UI
- RAG / vector health memory
- First-admin bootstrap/seed
- Docker / CI / production deploy scripts
- General audit log (only `inventory_movements`)
- Refresh tokens / OAuth social login
- Unique DB constraint on `medicine_name` (app-level check only)

---

### Known Bugs

| Issue | Evidence |
|---|---|
| `GET /medical-records/profile/{beneficiary_id}` is registered **after** `GET /medical-records/{beneficiary_id}` | `medical_record.py` order; `profile` will be captured as `beneficiary_id`. Working profile is `/patients/profile/...`. |
| First staff user cannot be created through the public register API | `POST /auth/register` requires admin |
| `test_inventory_movements_history` does not assert `/medicines/movements/history` | test file ends after restock PUT |
| Symptom checker can label “Flu” / “Migraine” from keywords only | `symptom_checker.py` |
| Patient enrollment is unauthenticated | `auth.py` `enroll_patient` has no `Depends` auth |

---

### Known Technical Debt

- Duplicate `get_db` (`dependencies.py` vs `utils/auth.py`)
- Inconsistent admin inclusion on patient search vs list
- `MedicalRecord.prescription` text vs `prescriptions` table
- `models/__init__.py` only imports two models; others imported from `main.py` / Alembic env
- Baseline migration is `create_all`, not a fully explicit Alembic autogenerate
- QR payload PII + hardcoded `"verified": True`
- OpenAI model string not validated against a live account
- `context_builder` lazy-loads medicines
- Historical docs (`project_status.md` body was stale) — stubbed to avoid contradiction

---

### Current Architecture Status

**Stable enough to extend**, not experimental. Hardening (authz, inventory, Alembic, env config, ID lock) already landed. No in-flight architecture rewrite on `main`.

---

### Current Environment

| Item | Value |
|---|---|
| OS (this workspace) | Windows |
| Branch | `main` |
| Python used for latest test run | `backend\venv\Scripts\python.exe` |
| Project venv | Present at `backend\venv\` |
| Postgres / `.env` | Not verified in this pass (**UNKNOWN** whether a local Postgres DB is running) |
| Extra worktrees | `agents/fix-medvault-code-issues`, `agents/repository-audit-and-assessment` (older commits; **not** `main`) |

---

### Last Successfully Tested

`Set-Location .\backend; .\venv\Scripts\python.exe -m unittest discover -s tests`  
Result: **6 tests passed** (`backend/tests/test_security_and_dispensing.py`), with post-run SQLite resource warnings (`unclosed database`).

Coverage remains narrow; this is not end-to-end validation of Postgres, first-admin bootstrap, or deployment behavior.

---

### Current Blocker

1. **First-admin bootstrap is still undefined in-repo** (`/auth/register` requires existing admin, no seed flow is provided).  
2. Product-wise, **there is no UI** — all “portals” are API-only.

---

### Exact Next Step

**Resolve first-admin bootstrap as an explicit, documented flow**, then address known route/test gaps:

1. Decide and document how the first `admin` is created in a fresh database (**NEEDS CONFIRMATION**).
2. Fix `medical-records` route shadowing (`/profile/{beneficiary_id}` vs `/{beneficiary_id}` order).
3. Complete assertions for `test_inventory_movements_history` and add missing high-risk auth/inventory cases.
4. Then start a first frontend flow if product scope prioritizes UI.

The single most logical **backend** step is first-admin bootstrap definition + route/test hardening. The single most logical **product** step after that remains a first UI flow.

---

### Do Not Change Casually

- `dispense_prescription` locking and movement uniqueness
- Beneficiary ID generation + lock `260001`
- `require_patient_access` and role CHECK
- Env-required `DATABASE_URL` / `JWT_SECRET_KEY`
- Alembic chain; patient DOB vs blood_group types
- Route ordering on patients/medicines/prescriptions
- Deprecated pharmacy dispense still delegating to the same service
