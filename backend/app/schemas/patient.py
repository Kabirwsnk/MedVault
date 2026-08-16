from datetime import date

from pydantic import BaseModel, Field

from app.schemas.medical_record import MedicalRecordSummary


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    phone_number: str = Field(min_length=7, max_length=25)
    aadhar_number: str = Field(min_length=12, max_length=20)
    blood_group: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    height_cm: int | None = Field(default=None, gt=0, le=300)
    weight_kg: int | None = Field(default=None, gt=0, le=1000)
    emergency_contact: str | None = None


class PatientResponse(BaseModel):
    id: int
    beneficiary_id: str
    full_name: str
    phone_number: str
    blood_group: str | None = None
    date_of_birth: date | None = None
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
    date_of_birth: date | None = None
    gender: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    emergency_contact: str | None = None
    medical_records: list[MedicalRecordSummary]


class PatientSearchResponse(BaseModel):
    beneficiary_id: str
    full_name: str
    phone_number: str

    class Config:
        from_attributes = True


class PatientUpdate(BaseModel):
    phone_number: str = Field(min_length=7, max_length=25)
    blood_group: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    height_cm: int | None = Field(default=None, gt=0, le=300)
    weight_kg: int | None = Field(default=None, gt=0, le=1000)
    emergency_contact: str | None = None
