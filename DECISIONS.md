# MedVault decisions

Legend:

- **EXPLICIT DECISION** — stated in repo docs/commits/comments, or clearly intentional architecture.
- **CURRENT IMPLEMENTATION CHOICE** — what the code does; not written down as a debate.
- **Not explicitly decided** — do not treat as a frozen product choice.

Dates: from git history on `main` where known. Authors/context otherwise UNKNOWN.

---

## Decision: FastAPI backend

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE (repo started this way; no ADR)

**Decision:** Python FastAPI as the HTTP API.

**Alternatives considered:** Not documented. (Django, Flask, Node, etc. — **Not explicitly decided** as rejected options.)

**Why we chose it:** UNKNOWN beyond “this is what was built.” FastAPI gives `/docs` which is the only UI.

**Tradeoffs:** Fast iteration and typed schemas vs no batteries-included admin UI.

**Consequences:** All product features are HTTP routes under `backend/app/`.

**Date/context:** Initial commits (`57ba50d` first FastAPI endpoint).

---

## Decision: PostgreSQL + SQLAlchemy

**Status:** Accepted  
**Type:** EXPLICIT in older project notes + `.env.example` + OPERATIONS.md

**Decision:** PostgreSQL as the datastore; SQLAlchemy ORM; `psycopg2`.

**Alternatives considered:** Tests use SQLite — a **test convenience**, not a production alternative. Other DBs: Not explicitly decided.

**Why:** Relational clinical/inventory data; advisory lock for Beneficiary IDs is PostgreSQL-specific (`pg_advisory_xact_lock`).

**Tradeoffs:** SQLite tests do not exercise advisory locks or some PG types.

**Consequences:** Production-like runs need Postgres. Do not assume SQLite for ID generation.

---

## Decision: Alembic migrations (not create_all on startup)

**Status:** Accepted  
**Type:** EXPLICIT (`OPERATIONS.md`, `main.py` has no `create_all`)

**Decision:** Schema via Alembic. Baseline revision uses `Base.metadata.create_all`. Second revision fixes swapped patient column types.

**Alternatives considered:** Auto `create_all` on boot (common in early tutorials). Pre-Alembic DBs must **not** be stamped blindly.

**Why:** Integrity fields (authorship, inventory movements) were missing on old DBs.

**Tradeoffs:** Fresh DB is easy; existing messy DBs need a manual reconciliation.

**Consequences:** Operators must run `alembic upgrade head`. See `OPERATIONS.md`.

---

## Decision: JWT + bcrypt + role strings

**Status:** Accepted  
**Type:** EXPLICIT (sprint commits; `roles.py`; DB CHECK on `users.role`)

**Decision:** HS256 JWT with `sub`=email and `role`; Passlib bcrypt; `require_role`.

**Alternatives considered:** Not documented (sessions, OAuth providers, etc. — **Not explicitly decided**).

**Why:** Protect routes per clinic role without an external IdP.

**Tradeoffs:** No refresh tokens; secret must be rotated if leaked; first admin cannot be created via register.

**Consequences:** All mutating clinical/pharmacy routes depend on Bearer tokens except enrollment and login.

**Date/context:** Sprint 4 / JWT commits (`5a65064`, `d8c912d`).

---

## Decision: Five roles including admin and patient

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE (CHECK constraint + constants)

**Decision:** `admin`, `doctor`, `registration_worker`, `pharmacy`, `patient`.

**Alternatives considered:** Older notes listed four roles without `admin`. Admin was added in later hardening.

**Why:** Staff provisioning + patient read of own data.

**Tradeoffs:** Role matrix is inconsistent across endpoints (search vs list vs cards).

---

## Decision: Environment-based secrets (no hard-coded DB password / JWT)

**Status:** Accepted  
**Type:** EXPLICIT (`config.py` `required_setting`, `.env.example`, OPERATIONS.md “rotate both before use”)

**Decision:** `DATABASE_URL` and `JWT_SECRET_KEY` required from env.

**Alternatives considered:** Hard-coded local credentials (removed; OPERATIONS warns not to reuse old values).

**Why:** Avoid leaking secrets in git.

**Tradeoffs:** App will not import without a `.env` / env vars (tests set env first).

---

## Decision: Beneficiary ID format MV + YY + 4 digits + advisory lock

**Status:** Accepted  
**Type:** EXPLICIT (handoff docs + `patient.py` comments + commit `9b1f03f`)

**Decision:** `MV{yy}{nnnn}`; serialize generation with `pg_advisory_xact_lock(260001)`; cap 9999/year.

**Alternatives considered:** UUID-only IDs — **Not explicitly decided** as a rejected product option; UUID is not used as the public ID.

**Why:** Human-readable clinic IDs; lock avoids two workers minting the same ID.

**Tradeoffs:** PostgreSQL-only lock; year encoded in ID; 9999/year limit.

**Consequences:** Do not change format without a migration and card/QR consumers.

---

## Decision: Unique Aadhaar on patients

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE (unique column + create-patient check)

**Decision:** One patient row per `aadhar_number`.

**Alternatives considered:** Not documented.

**Why:** Duplicate-registration prevention (stated in older context).

**Tradeoffs:** Stores government ID in the app database; privacy/regulatory burden.

---

## Decision: Object-level patient authorization

**Status:** Accepted  
**Type:** EXPLICIT (commit `aa0965b` / authz helper)

**Decision:** `require_patient_access`: staff sets (clinical vs demographic) or admin or the linked patient user.

**Alternatives considered:** Role-only checks (earlier; patients could hit others’ IDs — later fixed).

**Why:** Patients must not read other patients’ PHI.

**Tradeoffs:** Not every route uses the helper (e.g. timeline is doctor-only; medical history is doctor-only).

---

## Decision: Medical record authorship

**Status:** Accepted  
**Type:** EXPLICIT (model `doctor_id` + update 403 + tests)

**Decision:** Creating doctor stored on the record; other doctors cannot PUT unless admin.

**Alternatives considered:** Any doctor can edit any record.

**Why:** Clinical accountability.

**Tradeoffs:** `doctor_id` is nullable; NULL skips the author check (`if record.doctor_id is not None and ...`).

---

## Decision: Inventory movements + atomic dispense in a service

**Status:** Accepted  
**Type:** EXPLICIT (`inventory.py` docstring, unique `prescription_id` on movements, tests)

**Decision:** Single `dispense_prescription` service; row locks; one movement per dispense; restock/adjust also write movements.

**Alternatives considered:** Decrement stock only on the medicine row (earlier sprint 8 style).

**Why:** Auditability; prevent double dispense (`409`).

**Tradeoffs:** More tables; SQLite tests vs PG locks.

**Consequences:** Deprecated `/pharmacy/dispense/{id}` must keep calling the same function.

---

## Decision: Dual prescription representation

**Status:** Accepted as current design  
**Type:** CURRENT IMPLEMENTATION CHOICE — **Not explicitly decided** as a product ADR

**Decision:** `medical_records.prescription` is a string; `prescriptions` table holds medicine line items.

**Alternatives considered:** Not documented.

**Why:** UNKNOWN (likely incremental sprints: text first, then structured Rx).

**Tradeoffs:** Two sources of “what was prescribed”; timeline shows both.

**Consequences:** AI context includes both text and line items.

---

## Decision: OpenAI behind a provider + offline fallback

**Status:** Accepted  
**Type:** EXPLICIT (commits `1727b39`, `50760dc`; `openai_service.py` empty-key branches)

**Decision:** `AI_PROVIDER = "openai"`; model `gpt-4.1-mini`; if no key or client fail, return placeholder text. Symptom checker stays rule-based.

**Alternatives considered:** Other providers — code raises `ValueError` if not openai. **Not explicitly decided** to support them yet.

**Why:** Demo AI without forcing a paid key; keep an extension point.

**Tradeoffs:** Placeholder can look like a “summary” but is mostly dumped context; model id may be wrong for a given OpenAI account.

---

## Decision: No RAG in the implementation

**Status:** Accepted as **current reality**  
**Type:** CURRENT IMPLEMENTATION CHOICE. Marketing claimed RAG; code does string context.

**Decision:** `build_patient_context` concatenates SQL data.

**Alternatives considered:** RAG / vector DB — mentioned in GitHub description, **not built**.

**Why implementation vs marketing:** UNKNOWN.

**Tradeoffs:** Simple, no embedding infra; context grows with every record; not “memory retrieval.”

---

## Decision: In-memory QR and PDF cards (no file store)

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE (`card_service.py`, patient router)

**Decision:** Generate PNG/PDF bytes per request; QR JSON includes id, name, phone, blood_group, emergency, `verified: true`.

**Alternatives considered:** Stored files, signed QR without PII — **Not explicitly decided**.

**Why:** Demonstrable cards without object storage.

**Tradeoffs:** CPU per request; QR contains PII; `verified: true` is not a cryptographic proof.

---

## Decision: API-only / no frontend in-repo

**Status:** Accepted as current  
**Type:** CURRENT IMPLEMENTATION CHOICE — **Not explicitly decided** as “we will never have a UI”

**Decision:** Backend repo only.

**Alternatives considered:** Monorepo with React/etc. — not present.

**Consequences:** CORS not configured; product “portals” are API tag names, not apps.

---

## Decision: Unittest + TestClient (not pytest)

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE

**Decision:** `python -m unittest discover -s tests`; one module `test_security_and_dispensing.py`.

**Alternatives considered:** Not documented.

**Tradeoffs:** Coverage is narrow (authz, dispense, authorship, some AI/card tests). `test_inventory_movements_history` restocks but does not assert the history GET.

---

## Decision: Deployment strategy

**Status:** Not explicitly decided  

No Docker, CI config, or host docs in this repo. OPERATIONS describes local Alembic + Uvicorn only.

---

## Decision: Tech stack replacements (Django, Mongo, Next.js, etc.)

**Status:** Not explicitly decided — and **must not be done casually**

The current stack is FastAPI + Postgres + JWT. Changing it is a new explicit decision, not an implicit cleanup.
