# MedVault decisions

Legend:

- **EXPLICIT DECISION** — stated in repo docs/commits/comments, or clearly intentional architecture.
- **CURRENT IMPLEMENTATION CHOICE** — what the code does; not written down as a debate.
- **Not explicitly decided** — do not treat as a frozen product choice.

Dates: from git history on `main` where known. Authors/context otherwise UNKNOWN.

---

## Decision: Vite + React 19 + TypeScript Frontend SPA

**Status:** Accepted  
**Type:** EXPLICIT DECISION

**Decision:** Built a standalone Single Page Application in `/frontend` using Vite, React 19, TypeScript, React Router DOM, and custom Vanilla CSS design tokens. The visual language is a restrained clinical workstation rather than a marketing dashboard.

**Why:** MedVault advertised portals (Doctor, Pharmacy, Registration Worker, Patient, Admin) but only exposed Swagger docs.

**Tradeoffs:** Requires running both Node/Vite (port 5173) and Uvicorn (port 8000) during local development.

---

## Decision: FastAPI CORS Integration

**Status:** Accepted  
**Type:** EXPLICIT DECISION

**Decision:** Integrated `CORSMiddleware` in `backend/app/main.py` driven by `CORS_ORIGINS` in `config.py` / `.env`.

**Why:** Allow the Vite frontend client on `localhost:5173` to make authenticated cross-origin requests with JWT credentials to the FastAPI backend.

---

## Decision: Dual-Sided Digital Beneficiary Health Cards

**Status:** Accepted  
**Type:** EXPLICIT DECISION

**Decision:** Implemented interactive dual-sided card modals in the frontend (`BeneficiaryCardModal.tsx`) with front demographic identity view and back clinical/QR view, paired with one-click PDF card exports.

---

## Decision: FastAPI backend

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE (repo started this way; no ADR)

**Decision:** Python FastAPI as the HTTP API.

**Tradeoffs:** Fast iteration and typed schemas vs no batteries-included admin UI.

**Consequences:** All product features are HTTP routes under `backend/app/`.

---

## Decision: PostgreSQL + SQLAlchemy

**Status:** Accepted  
**Type:** EXPLICIT in project notes + `.env.example` + OPERATIONS.md

**Decision:** PostgreSQL as the datastore; SQLAlchemy ORM; `psycopg2`.

**Why:** Relational clinical/inventory data; advisory lock for Beneficiary IDs is PostgreSQL-specific (`pg_advisory_xact_lock`).

---

## Decision: Alembic migrations (not create_all on startup)

**Status:** Accepted  
**Type:** EXPLICIT (`OPERATIONS.md`, `main.py` has no `create_all`)

**Decision:** Schema via Alembic. Baseline revision uses `Base.metadata.create_all`. Second revision fixes swapped patient column types.

---

## Decision: JWT + bcrypt + role strings

**Status:** Accepted  
**Type:** EXPLICIT (`roles.py`; DB CHECK on `users.role`)

**Decision:** HS256 JWT with `sub`=email and `role`; Passlib bcrypt; `require_role`.

---

## Decision: Five roles including admin and patient

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE (CHECK constraint + constants)

**Decision:** `admin`, `doctor`, `registration_worker`, `pharmacy`, `patient`.

---

## Decision: Beneficiary ID format MV + YY + 4 digits + advisory lock

**Status:** Accepted  
**Type:** EXPLICIT

**Decision:** `MV{yy}{nnnn}`; serialize generation with `pg_advisory_xact_lock(260001)`; cap 9999/year.

---

## Decision: Inventory movements + atomic dispense in a service

**Status:** Accepted  
**Type:** EXPLICIT

**Decision:** Single `dispense_prescription` service; row locks; one movement per dispense; restock/adjust also write movements.

---

## Decision: OpenAI behind a provider + offline fallback

**Status:** Accepted  
**Type:** EXPLICIT

**Decision:** `AI_PROVIDER = "openai"`; model `gpt-4.1-mini`; if no key or client fail, return placeholder text. Symptom checker stays rule-based.

## Decision: Async database sessions

**Status:** Accepted  
**Type:** CURRENT IMPLEMENTATION CHOICE

**Decision:** Runtime API routes use SQLAlchemy `AsyncSession` with `asyncpg` and configurable pooling. Alembic and bootstrap tooling retain a synchronous engine where that integration is simpler.

**Why:** Database I/O should not block FastAPI workers, while the migration boundary remains straightforward and testable.

## Decision: Controlled offline support

**Status:** Accepted  
**Type:** EXPLICIT

**Decision:** Cache the frontend shell and allow IndexedDB clinical drafts and retry-safe encounter synchronization. Beneficiary IDs, enrollment, dispensing, and inventory changes remain server-authoritative.

**Why:** Staff can continue documenting during brief outages without allowing offline clients to create conflicting identity or stock state.

## Decision: Clinical workstation UI

**Status:** Accepted  
**Type:** EXPLICIT

**Decision:** Use a neutral, compact, operational interface inspired by government and hospital software rather than a dark AI-dashboard aesthetic.

**Why:** Repeated clinical workflows prioritize scanning, clarity, predictable controls, and low visual distraction.
