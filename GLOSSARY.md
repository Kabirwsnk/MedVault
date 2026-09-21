# MedVault glossary

Short definitions as used **in this codebase**.

| Term | Meaning here |
|---|---|
| **Beneficiary ID** | Public patient identifier, e.g. `MV260001` (`MV` + year + 4-digit serial). Not the integer `patients.id`. |
| **Aadhaar** | Stored on `patients.aadhar_number` (unique). Used to block duplicate registration. |
| **Registration worker** | Role `registration_worker`. Creates patients and updates demographics. |
| **Pharmacy** | Role `pharmacy`. Not a separate microservice. |
| **Staff user** | A `users` row with a non-patient role. Created by admin via `/auth/register`. |
| **Patient enrollment** | Creates a `users` row with role `patient` and sets `patients.user_id`. |
| **PHI** | Patient-identifying or clinical data (name, phone, Aadhaar, notes, etc.). |
| **Medical record** | One encounter row: diagnosis, **text** `prescription`, notes, optional `doctor_id`. |
| **Prescription (text)** | Column `medical_records.prescription` — free text. |
| **Prescription (entity)** | Row in `prescriptions`: medicine, quantity, dosage, duration, dispensed flags. |
| **Dispense** | Pharmacy action: mark Rx dispensed, decrement stock, write `inventory_movements`. |
| **Inventory movement** | Audit row: restock, adjustment, or dispense with before/after stock. |
| **Low / critical stock** | `stock < LOW_STOCK_THRESHOLD` (default 20) / `CRITICAL_STOCK_THRESHOLD` (default 10). |
| **Beneficiary card** | JSON + QR PNG + PDF generated from patient + counts. Not a DB table. |
| **Timeline** | Doctor-only nested view of records → prescriptions → medicine names. |
| **Patient dashboard** | Patient-only nested view for **their** Beneficiary ID. |
| **Context builder** | Concatenates SQL data into a string for the LLM. **Not RAG.** |
| **RAG** | Retrieval-augmented generation. **Not implemented.** |
| **Offline AI** | Chat/summary placeholder when `OPENAI_API_KEY` is missing. |
| **Object-level access** | `require_patient_access`: staff role set, or admin, or the linked patient user. |
| **Advisory lock** | PostgreSQL `pg_advisory_xact_lock(260001)` during ID minting. |
| **Deprecated pharmacy dispense** | `POST /pharmacy/dispense/{id}` — same as `/prescriptions/{id}/dispense`. |
| **Async session** | SQLAlchemy `AsyncSession` used by runtime API routes for non-blocking database I/O. |
| **Idempotency key** | Client-provided `Idempotency-Key` used to replay a supported write response instead of creating a duplicate. |
| **Offline draft** | Local IndexedDB clinical draft that is not treated as a server-confirmed medical record. |
| **Pending sync** | Offline draft queued for submission after connectivity returns. |
| **Conflict** | A queued draft that the server rejected with a conflict and requires staff review. |
| **Server-authoritative** | An operation that must be confirmed by PostgreSQL-backed API state, such as dispensing or Beneficiary ID creation. |
| **Health endpoint** | Unauthenticated `GET /health` check reporting API database availability. |
