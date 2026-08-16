from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    role: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class PatientEnrollment(BaseModel):
    beneficiary_id: str = Field(min_length=4, max_length=32)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    class Config:
        from_attributes = True

