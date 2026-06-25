from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str            

    class Config:
        from_attributes = True

