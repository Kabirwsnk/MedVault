import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.config import CORS_ORIGINS, CORS_ORIGIN_REGEX
from app.database import Base, engine
from app.rate_limit import limiter

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
from app.models.inventory_movement import InventoryMovement
from app.routers.prescription import router as prescription_router

from app.routers.pharmacy import router as pharmacy_router
from app.routers.ai import router as ai_router
from app.routers.pharmacy_dashboard import router as pharmacy_dashboard_router
from app.routers.patient_dashboard import router as patient_dashboard_router
from app.routers.health import router as health_router

from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables and seed demo accounts idempotently on boot
    try:
        from app.manage import seed_demo
        seed_demo(ensure_tables=True)
    except Exception as exc:
        logger.warning("Startup demo seed check: %s", exc)
    yield


app = FastAPI(title="MedVault AI", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(IntegrityError)
async def handle_integrity_error(request: Request, exc: IntegrityError):
    logger.warning("Database constraint rejected request %s %s", request.method, request.url.path)
    return JSONResponse(status_code=409, content={"detail": "The request conflicts with existing data."})


@app.exception_handler(SQLAlchemyError)
async def handle_database_error(request: Request, exc: SQLAlchemyError):
    logger.exception("Database failure while handling %s %s", request.method, request.url.path)
    return JSONResponse(status_code=503, content={"detail": "Database temporarily unavailable."})

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient_router)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(medical_record_router)
app.include_router(dashboard_router)
app.include_router(medicine_router)
app.include_router(prescription_router)
app.include_router(pharmacy_router)
app.include_router(ai_router)
app.include_router(pharmacy_dashboard_router)
app.include_router(patient_dashboard_router)
app.include_router(health_router)

@app.get("/")
async def home():
    return {
        "message": "Welcome to MedVault AI"
    }
