from fastapi import FastAPI

from app.database import Base, engine

from app.models.patient import Patient
from app.models.user import User

from app.routers.patient import router as patient_router
from app.routers.auth import router as auth_router

from app.routers.users import router as user_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(patient_router)
app.include_router(auth_router)
app.include_router(user_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to MedVault AI"
    }