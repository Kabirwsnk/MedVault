from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PrescriptionCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(gt=0)
    dosage: str = Field(min_length=1, max_length=200)
    duration: str = Field(min_length=1, max_length=100)


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
