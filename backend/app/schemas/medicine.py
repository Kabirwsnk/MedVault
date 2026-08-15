from pydantic import BaseModel


class MedicineCreate(BaseModel):
    medicine_name: str
    manufacturer: str
    unit: str
    stock: int


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
    quantity: int             