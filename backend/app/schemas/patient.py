from pydantic import BaseModel
from app.schemas.medical_record import MedicalRecordSummary


class PatientCreate(BaseModel):
    full_name: str
    phone_number: str
    aadhar_number: str

    blood_group: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    emergency_contact: str | None = None


class PatientResponse(BaseModel):
    id: int
    beneficiary_id: str
    full_name: str
    phone_number: str

    blood_group: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    emergency_contact: str | None = None

    class Config:
        from_attributes = True
    
class PatientProfileResponse(BaseModel):

    beneficiary_id: str
    full_name: str
    phone_number: str

    blood_group: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    emergency_contact: str | None = None

    medical_records: list[MedicalRecordSummary]

    class Config:
        from_attributes = True  

class PatientSearchResponse(BaseModel):
    beneficiary_id: str
    full_name: str
    phone_number: str

    class Config:
        from_attributes = True