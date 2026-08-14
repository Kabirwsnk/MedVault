from pydantic import BaseModel


class DashboardResponse(BaseModel):

    total_patients: int

    total_medical_records: int

    total_prescriptions: int

    total_medicines: int


class RecentPatientResponse(BaseModel):

    beneficiary_id: str

    full_name: str

    class Config:
        from_attributes = True


class RecentMedicalRecordResponse(BaseModel):

    diagnosis: str

    prescription: str

    notes: str | None = None

    class Config:
        from_attributes = True