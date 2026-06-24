from fastapi import FastAPI

from app.database import Base, engine
from app.models.patient import Patient

from app.routers.patient import router as patient_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(patient_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to MedVault AI"
    }