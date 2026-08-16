from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PatientPrescriptionResponse(BaseModel):
    id: int
    medicine_name: str
    quantity: int
    dosage: str
    duration: str
    dispensed: bool
    dispensed_at: Optional[datetime] = None


class PatientMedicalRecordResponse(BaseModel):
    id: int
    diagnosis: str
    prescription: str
    notes: Optional[str] = None
    prescriptions: list[PatientPrescriptionResponse]


class PatientDashboardResponse(BaseModel):
    beneficiary_id: str
    full_name: str
    phone_number: str
    blood_group: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    emergency_contact: Optional[str] = None
    medical_records: list[PatientMedicalRecordResponse]
