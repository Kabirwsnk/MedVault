from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MedicineCreate(BaseModel):
    medicine_name: str
    manufacturer: str
    unit: str
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    stock: int = Field(ge=0)


class MedicineResponse(BaseModel):
    id: int
    medicine_name: str
    manufacturer: str
    unit: str
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    stock: int

    class Config:
        from_attributes = True


class MedicineUpdate(BaseModel):
    manufacturer: str
    unit: str
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    stock: int


class MedicineRestock(BaseModel):
    quantity: int = Field(gt=0)


class InventoryMovementResponse(BaseModel):
    id: int
    medicine_id: int
    prescription_id: int | None = None
    performed_by_user_id: int
    movement_type: str
    quantity: int
    stock_before: int
    stock_after: int
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
