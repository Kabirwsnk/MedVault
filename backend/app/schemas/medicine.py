from pydantic import BaseModel, Field


class MedicineCreate(BaseModel):
    medicine_name: str
    manufacturer: str
    unit: str
    stock: int = Field(ge=0)


class MedicineResponse(BaseModel):
    id: int
    medicine_name: str
    manufacturer: str
    unit: str
    stock: int

    class Config:
        from_attributes = True
        
        
class MedicineUpdate(BaseModel):
    manufacturer: str
    unit: str
    stock: int       
    
class MedicineRestock(BaseModel):
    quantity: int = Field(gt=0)
