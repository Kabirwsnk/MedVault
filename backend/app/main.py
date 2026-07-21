from fastapi import FastAPI

from app.database import Base, engine

from app.models.patient import Patient
from app.models.user import User

from app.routers.patient import router as patient_router
from app.routers.auth import router as auth_router

from app.routers.users import router as user_router

from app.routers.medical_record import router as medical_record_router

from app.routers.dashboard import router as dashboard_router

from app.models.medicine import Medicine

from app.routers.medicine import router as medicine_router

from app.models.prescription import Prescription

from app.routers.prescription import router as prescription_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(patient_router)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(medical_record_router)
app.include_router(dashboard_router)
app.include_router(medicine_router)
app.include_router(prescription_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to MedVault AI"
    }