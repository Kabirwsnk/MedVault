from pydantic import BaseModel


class PrescriptionCreate(BaseModel):
    medicine_id: int
    quantity: int
    dosage: str
    duration: str


class PrescriptionResponse(BaseModel):
    id: int
    medicine_id: int
    quantity: int
    dosage: str
    duration: str

    class Config:
        from_attributes = True