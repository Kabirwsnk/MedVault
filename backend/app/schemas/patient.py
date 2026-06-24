from pydantic import BaseModel


class PatientCreate(BaseModel):
    full_name: str
    phone_number: str
    aadhar_number: str