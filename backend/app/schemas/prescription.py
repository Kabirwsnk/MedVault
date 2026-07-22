from pydantic import BaseModel
from datetime import datetime
from typing import Optional


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
    
    dispensed: bool
    dispensed_at: Optional[datetime] = None

    class Config:
        from_attributes = True