# MEDVAULT AI – MASTER PROJECT CONTEXT (FULL HANDOFF DOCUMENT)

## PROJECT OVERVIEW

### Project Name

MedVault AI

### Project Type

Healthcare / Medical Record Management System

### Purpose

A centralized healthcare platform that stores patient information using a unique Beneficiary ID and allows:

* Registration Workers to register patients.
* Doctors to view patients, create medical records, and prescribe medicines.
* Pharmacy Workers to dispense medicines and manage inventory.
* Patients (future) to view their own records.

The system is designed as a scalable backend-first architecture with future AI integrations.

---

# BUSINESS WORKFLOW

## Registration Worker

1. Login
2. Register patient
3. Generate Beneficiary ID

Example:

```text
MV260001
MV260002
MV260003
```

Format:

```text
MV + YY + 4 digit serial

MV260001
```

where:

```text
26 = year 2026
0001 = sequence
```

---

## Doctor

1. Search patient
2. View profile
3. Create medical record
4. Create prescriptions
5. View timeline/history
6. View dashboards

---

## Pharmacy

1. View prescriptions
2. Dispense medicines
3. Stock automatically decreases
4. Monitor inventory
5. Restock medicines
6. View dispensing history
7. View pharmacy dashboard

---

## Patient (Future)

Read-only access to:

* Profile
* Medical records
* Prescriptions
* Beneficiary card

---

# TECH STACK

## Backend

FastAPI

## Database

PostgreSQL

## ORM

SQLAlchemy

## Validation

Pydantic

## Authentication

JWT Authentication

## Password Hashing

Passlib + bcrypt

## API Docs

Swagger UI

---

# PROJECT STRUCTURE

```text
backend/
│
├── app/
│   │
│   ├── main.py
│   ├── database.py
│   ├── dependencies.py
│   │
│   ├── models/
│   │   ├── patient.py
│   │   ├── medical_record.py
│   │   ├── medicine.py
│   │   ├── prescription.py
│   │   └── user.py
│   │
│   ├── schemas/
│   │   ├── patient.py
│   │   ├── medical_record.py
│   │   ├── medicine.py
│   │   ├── prescription.py
│   │   ├── dashboard.py
│   │   ├── pharmacy_dashboard.py
│   │   ├── timeline.py
│   │   └── beneficiary_card.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── patient.py
│   │   ├── medical_record.py
│   │   ├── medicine.py
│   │   ├── prescription.py
│   │   ├── dashboard.py
│   │   └── pharmacy_dashboard.py
│   │
│   └── utils/
│       ├── security.py
│       ├── roles.py
│       └── ai/
│
└── venv/
```

---

# DATABASE CONFIGURATION

database.py

```python
DATABASE_URL = "postgresql://<user>:<password>@localhost:5432/MedVault"
```

DO NOT STORE REAL PASSWORDS IN FUTURE CONTEXT.

Current database name:

```text
MedVault
```

Verified by:

```sql
SELECT current_database();
```

Output:

```text
MedVault
```

---

# AUTHENTICATION SYSTEM

JWT based.

Roles:

```text
doctor
registration_worker
pharmacy
patient
```

Role protection:

```python
require_role([...])
```

Used throughout APIs.

Example:

```python
current_user=Depends(
    require_role(["doctor"])
)
```

---

# PATIENT MODEL

File:

```text
app/models/patient.py
```

Fields:

```python
id
beneficiary_id
full_name
phone_number
aadhar_number

blood_group
date_of_birth
gender
height_cm
weight_kg
emergency_contact
```

Relationship:

```python
records = relationship(
    "MedicalRecord",
    back_populates="patient"
)
```

---

# MEDICAL RECORD MODEL

File:

```text
app/models/medical_record.py
```

Fields:

```python
id
patient_id

diagnosis
prescription
notes
```

Relationships:

```python
patient
prescriptions
```

```python
prescriptions = relationship(
    "Prescription",
    back_populates="medical_record"
)
```

---

# MEDICINE MODEL

File:

```text
app/models/medicine.py
```

Fields:

```python
id
medicine_name
manufacturer
unit
stock
```

Relationship:

```python
prescriptions
```

---

# PRESCRIPTION MODEL

File:

```text
app/models/prescription.py
```

Fields:

```python
id
medical_record_id
medicine_id

quantity
dosage
duration

dispensed
dispensed_at
```

Relationships:

```python
medical_record
medicine
```

---

# PATIENT FEATURES IMPLEMENTED

## Create Patient

POST

```text
/patients/
```

Registration worker only.

Duplicate Aadhaar prevention:

```python
Patient.aadhar_number
```

checked before insertion.

---

## Search Patients

GET

```text
/patients/search?name=
```

Uses:

```python
Patient.full_name.ilike()
```

---

## List All Patients

GET

```text
/patients/all
```

Doctor only.

---

## Get Patient

GET

```text
/patients/{beneficiary_id}
```

---

## Update Patient

PUT

```text
/patients/{beneficiary_id}
```

Updates:

```text
phone
blood_group
DOB
gender
height
weight
emergency contact
```

---

## Patient Profile

GET

```text
/patients/profile/{beneficiary_id}
```

Returns:

```text
profile
medical records
```

---

# MEDICAL RECORD FEATURES

## Add Medical Record

POST

```text
/medical-records/{beneficiary_id}
```

Doctor only.

Creates:

```text
diagnosis
prescription
notes
```

---

## Update Medical Record

PUT

```text
/medical-records/{record_id}
```

Doctor only.

---

## Medical History

GET

```text
/medical-records/{beneficiary_id}
```

Returns:

```json
{
  "beneficiary_id": "",
  "patient_name": "",
  "records": [...]
}
```

---

# MEDICINE FEATURES

## Add Medicine

POST

```text
/medicines/
```

Pharmacy only.

Duplicate medicine name prevention.

---

## Get All Medicines

GET

```text
/medicines/
```

Doctor + Pharmacy

---

## Get Single Medicine

GET

```text
/medicines/{medicine_id}
```

Doctor + Pharmacy

---

## Low Stock

GET

```text
/medicines/low-stock
```

Returns:

```text
stock < 20
```

IMPORTANT:

Must be ABOVE:

```python
/{medicine_id}
```

Otherwise FastAPI treats:

```text
low-stock
```

as medicine_id.

This bug already happened and was fixed.

---

## Critical Stock

GET

```text
/medicines/critical-stock
```

Returns:

```text
stock < 10
```

Must also be ABOVE:

```python
/{medicine_id}
```

---

## Restock Medicine

PUT

```text
/medicines/{medicine_id}/restock
```

Body:

```json
{
  "quantity": 100
}
```

Increases stock.

Implemented.

Schema:

```python
MedicineRestock
```

---

# PRESCRIPTION FEATURES

## Create Prescription

POST

```text
/prescriptions/{medical_record_id}
```

Doctor only.

Checks:

```text
medical record exists
medicine exists
```

Creates:

```text
medicine_id
quantity
dosage
duration
```

---

## Get Prescription

GET

```text
/prescriptions/{prescription_id}
```

---

## Get All Prescriptions

GET

```text
/prescriptions/
```

---

## Dispense Prescription

POST

```text
/prescriptions/{prescription_id}/dispense
```

Pharmacy only.

Checks:

```text
prescription exists
not already dispensed
medicine exists
stock sufficient
```

Then:

```python
medicine.stock -= prescription.quantity

prescription.dispensed = True
prescription.dispensed_at = datetime.utcnow()
```

---

## Dispensing History

GET

```text
/prescriptions/dispensed/history
```

Returns:

```text
all dispensed prescriptions
ordered by latest
```

IMPORTANT:

Must be ABOVE:

```python
/prescriptions/{prescription_id}
```

or FastAPI throws:

```text
422 int parsing error
```

This exact bug happened and was fixed.

---

# DASHBOARD FEATURES

## Main Dashboard

GET

```text
/dashboard/stats
```

Doctor only.

Returns:

```text
total_patients
total_medical_records
total_prescriptions
total_medicines
```

Implemented and working.

---

# PHARMACY DASHBOARD

GET

```text
/pharmacy-dashboard/stats
```

Pharmacy only.

Returns:

```text
total_medicines
low_stock_medicines
total_prescriptions
pending_prescriptions
dispensed_prescriptions
```

Implemented and tested.

---

# PATIENT TIMELINE

FULL TIMELINE FEATURE IMPLEMENTED

Route:

```text
GET /patients/timeline/{beneficiary_id}
```

Returns:

```json
{
  "beneficiary_id": "",
  "full_name": "",
  "medical_records": [
    {
      "id": 1,
      "diagnosis": "",
      "prescription": "",
      "notes": "",
      "prescriptions": [
        {
          "id": 1,
          "quantity": 10,
          "dosage": "",
          "duration": "",
          "dispensed": true,
          "dispensed_at": "...",
          "medicine_name": ""
        }
      ]
    }
  ]
}
```

Uses:

```python
joinedload()
```

to load:

```text
Patient
→ MedicalRecord
→ Prescription
→ Medicine
```

---

# TIMELINE SCHEMAS

File:

```text
app/schemas/timeline.py
```

Contains:

```python
TimelinePrescription
TimelineMedicalRecord
PatientTimelineResponse
```

IMPORTANT BUG:

At one point:

```python
TimelineRecord
```

was imported but did not exist.

Error:

```text
ImportError:
cannot import name 'TimelineRecord'
```

Fixed by changing references to:

```python
TimelineMedicalRecord
```

---

# BENEFICIARY CARD FEATURE

CURRENT STATUS

PARTIALLY STARTED

Schema intended:

File:

```text
app/schemas/beneficiary_card.py
```

Model:

```python
BeneficiaryCardResponse
```

Fields:

```text
beneficiary_id
full_name
phone_number
blood_group
date_of_birth
gender
emergency_contact

total_medical_records
total_prescriptions
```

Route intended:

```text
GET /patients/card/{beneficiary_id}
```

Role access:

```text
doctor
registration_worker
patient
```

THIS FEATURE WAS NOT FULLY VERIFIED YET.

This is the next area to continue.

---

# AI CONTEXT BUILDER

Implemented earlier.

Commits mention:

```text
AI Context Builder
Provider Abstraction
OpenAI Integration Architecture
```

Architecture exists.

Actual AI medical features are future work.

---

# IMPORTANT BUGS FIXED

## Bug 1

Patient creation:

```text
date_of_birth invalid keyword argument
```

Cause:

Fields added outside Patient class.

Fixed by moving:

```python
date_of_birth
gender
blood_group
height_cm
weight_kg
emergency_contact
```

inside Patient model class.

---

## Bug 2

Database column already exists

Error:

```text
column already exists
```

Cause:

ALTER TABLE executed twice.

Not a real issue.

---

## Bug 3

Patient already exists after deletion

Cause:

Wrong database confusion.

Eventually verified:

```sql
SELECT current_database();
```

returned:

```text
MedVault
```

Correct DB confirmed.

---

## Bug 4

ModuleNotFoundError

```text
No module named backend
```

Cause:

Import used:

```python
from backend.app....
```

Fixed:

```python
from app....
```

---

## Bug 5

Route conflicts

Occurred multiple times.

Examples:

```text
low-stock
critical-stock
dispensed/history
```

being interpreted as:

```text
medicine_id
prescription_id
```

Fix:

Always place specific routes BEFORE:

```python
/{id}
```

routes.

---

# GIT STATUS

Repository is connected.

Branch:

```text
main
```

Latest verified commit:

```text
8243bab
Sprint 7 completed - patient timeline, prescriptions, dispensing and medicine management
```

Recent history:

```text
8243bab Sprint 7 completed - patient timeline, prescriptions, dispensing and medicine management

50760dc Added patient profile model, AI context builder, OpenAI provider abstraction and profile enhancements

1727b39 Refactor AI architecture and add context builder

1c6bede Sprint 8 completed: Pharmacy dispensing workflow with inventory management

93af382 Sprint 8: Add prescription module foundation
```

Repository was verified clean:

```bash
git status
```

Output:

```text
nothing to commit, working tree clean
```

---

# CURRENT WORKING FEATURES CHECKLIST

Authentication
✔

Role-based Access
✔

Patient Registration
✔

Patient Search
✔

Patient Update
✔

Patient Profile
✔

Medical Records
✔

Medical History
✔

Medicine Inventory
✔

Low Stock
✔

Critical Stock
✔

Restock
✔

Prescription Creation
✔

Prescription Retrieval
✔

Prescription Dispensing
✔

Dispensing History
✔

Dashboard
✔

Pharmacy Dashboard
✔

Patient Timeline
✔

AI Context Builder
✔

Beneficiary Card
⏳ In Progress

PDF Generation
❌ Not Started

Patient Portal
❌ Not Started

Audit Logs
❌ Not Started

QR Beneficiary Card
❌ Not Started

AI Medical Summary
❌ Not Started

---

# EXACT NEXT TASK TO CONTINUE

Continue Beneficiary Card feature:

1. Verify/create:

```text
app/schemas/beneficiary_card.py
```

2. Add:

```text
GET /patients/card/{beneficiary_id}
```

3. Test in Swagger

4. Verify counts:

```text
total_medical_records
total_prescriptions
```

5. Then implement:

```text
PDF Beneficiary Card Generation
```

This is the next recommended milestone because it is highly demonstrable for the final project.

END OF MASTER CONTEXT
