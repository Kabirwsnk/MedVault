from pydantic import BaseModel
from app.schemas.medical_record import MedicalRecordSummary


class PatientCreate(BaseModel):
    full_name: str
    phone_number: str
    aadhar_number: str


class PatientResponse(BaseModel):
    id: int
    beneficiary_id: str
    full_name: str
    phone_number: str
    
class PatientProfileResponse(BaseModel):

    beneficiary_id: str
    full_name: str
    phone_number: str

    medical_records: list[MedicalRecordSummary]

    class Config:
        from_attributes = True    
