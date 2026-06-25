from pydantic import BaseModel


class PatientCreate(BaseModel):
    full_name: str
    phone_number: str
    aadhar_number: str


class PatientResponse(BaseModel):
    id: int
    beneficiary_id: str
    full_name: str
    phone_number: str

    class Config:
        from_attributes = True