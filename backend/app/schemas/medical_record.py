from pydantic import BaseModel


class MedicalRecordCreate(BaseModel):
    diagnosis: str
    prescription: str
    notes: str | None = None


class MedicalRecordResponse(BaseModel):
    id: int
    diagnosis: str
    prescription: str
    notes: str | None = None

class MedicalRecordSummary(BaseModel):
    diagnosis: str
    prescription: str
    notes: str | None = None

    class Config:
        from_attributes = True
    