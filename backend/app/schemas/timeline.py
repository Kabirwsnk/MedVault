from pydantic import BaseModel
from datetime import datetime


class TimelinePrescription(BaseModel):
    id: int
    quantity: int
    dosage: str
    duration: str

    dispensed: bool
    dispensed_at: datetime | None = None

    medicine_name: str

    class Config:
        from_attributes = True


class TimelineMedicalRecord(BaseModel):
    id: int

    diagnosis: str
    prescription: str
    notes: str | None = None

    prescriptions: list[TimelinePrescription]


class PatientTimelineResponse(BaseModel):

    beneficiary_id: str
    full_name: str

    medical_records: list[TimelineMedicalRecord]