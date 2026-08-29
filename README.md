# MedVault

**Your Health. Secured Forever.**

MedVault is a **full-stack healthcare platform and clinical identity system**. It stores patient identity and clinical data around a unique, collision-free **Beneficiary ID**, and exposes role-protected stations for registration workers, doctors, pharmacy staff, patients, and system administrators.

Repository: [https://github.com/Kabirwsnk/MedVault.git](https://github.com/Kabirwsnk/MedVault.git)

---

## Core Features Implemented

* **Modern Web SPA (`/frontend`):**
  * Built with Vite + React 19 + TypeScript with a dark cyber-medical theme and Lucide icons.
  * Role-protected stations with JWT authentication, test presets, and live backend connection checks.
  * Interactive dual-sided digital Beneficiary Cards with holographic badges, QR tokens, and one-click PDF downloads.
  * Beneficiary Registration Station with auto-formatted 12-digit Aadhaar input, live Age calculation, and BMI classification.
  * Searchable Beneficiary Directory with live demographic editor (`PUT /patients/{id}`).
  * Dedicated portals for Doctors (encounters & timeline), Pharmacy (queue & atomic dispense), Patients (health vault & card), AI Clinical Assistant, and Admin Provisioning.
* **FastAPI Backend (`/backend`):**
  * PostgreSQL datastore with Alembic migrations (`0002_fix_patient_column_types`).
  * HS256 JWT auth, role RBAC (`admin`, `doctor`, `registration_worker`, `pharmacy`, `patient`), and object-level PHI authorization.
  * Transactional advisory locks (`pg_advisory_xact_lock(260001)`) guaranteeing collision-free Beneficiary ID minting (`MV26XXXX`).
  * Atomic pharmacy dispensing with row locks and immutable `inventory_movements` audit logging.
  * In-memory QR PNG and PDF card generation.
  * AI symptom checker and patient-context summary/chat (OpenAI with offline fallback).
  * 10 unit tests passing.

---

## Target Roles

| Role | What they do in MedVault |
|---|---|
| `registration_worker` | Register beneficiaries, search directory, update demographics, view/download digital & PDF health cards |
| `doctor` | Write clinical encounter notes, review longitudinal timelines, draft prescriptions, consult AI clinical assistant |
| `pharmacy` | Review active prescription queue, execute atomic stock dispenses, manage medicine catalog, track movement audits |
| `patient` | Access personal health vault, review diagnosis history, and download digital beneficiary cards |
| `admin` | System-wide oversight, staff account provisioning, elevated access to all stations |

---

## Technology Stack

| Layer | Choice |
|---|---|
| Frontend Client | Vite, React 19, TypeScript, React Router DOM, Lucide React, Custom CSS Tokens |
| Backend API | FastAPI + Uvicorn with CORSMiddleware |
| ORM & Datastore | SQLAlchemy 2.x, PostgreSQL + psycopg2 |
| Migrations | Alembic |
| Auth & Security | JWT (`python-jose`, HS256), Passlib bcrypt, Advisory Locks |
| Cards & Identity | `qrcode`, Pillow, ReportLab |
| AI Integration | OpenAI Chat Completions SDK with offline prompt fallback |

---

## Run Locally

### 1. Backend Service
```powershell
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # edit with your DB & JWT secrets
alembic -c alembic.ini upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* Backend API root: `http://localhost:8000/`
* Swagger Interactive Docs: `http://localhost:8000/docs`

### 2. Frontend Client
```powershell
cd frontend
npm install
npm run dev
```

* Web App URL: **`http://localhost:5173/`**

### 3. Run Backend Regression Tests
```powershell
cd backend
.\venv\Scripts\python.exe -m unittest discover -s tests
```

---

## Test Accounts (Quick Presets)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@local.test` | `AdminSecurePassword123!` |
| **Doctor** | `doctor@medvault.test` | `DoctorSecurePassword123!` |
| **Pharmacy** | `pharmacy@medvault.test` | `PharmacySecurePassword123!` |
| **Registration** | `worker@medvault.test` | `WorkerSecurePassword123!` |
