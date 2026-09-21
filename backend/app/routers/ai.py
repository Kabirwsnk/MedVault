from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.ai.context_builder import build_patient_context
from app.ai.provider import ask_ai, summarize_ai
from app.ai.symptom_checker import analyze_symptoms
from app.dependencies import get_async_db
from app.models.patient import Patient
from app.utils.authorization import CLINICAL_STAFF, require_patient_access
from app.utils.roles import ROLE_ADMIN, ROLE_DOCTOR, ROLE_PATIENT, require_role

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.get("/")
async def ai_home():
    return {
        "message": "MedVault AI Module Running"
    }


@router.get("/symptom-checker")
async def symptom_checker(
    symptoms: str,
    current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PATIENT, ROLE_ADMIN])),
):
    result = analyze_symptoms(symptoms)
    return result


@router.get("/chat")
async def ai_chat(
    beneficiary_id: str,
    question: str,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PATIENT, ROLE_ADMIN])),
):
    result = await db.execute(
        select(Patient).where(Patient.beneficiary_id == beneficiary_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    require_patient_access(current_user, patient, CLINICAL_STAFF)

    context = await build_patient_context(beneficiary_id, db)

    answer = await run_in_threadpool(ask_ai, question, context)

    return {
        "beneficiary_id": beneficiary_id,
        "question": question,
        "answer": answer
    }


@router.get("/summary/{beneficiary_id}")
async def ai_patient_summary(
    beneficiary_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PATIENT, ROLE_ADMIN])),
):
    result = await db.execute(
        select(Patient).where(Patient.beneficiary_id == beneficiary_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    require_patient_access(current_user, patient, CLINICAL_STAFF)

    context = await build_patient_context(beneficiary_id, db)

    summary = await run_in_threadpool(summarize_ai, context)

    return {
        "beneficiary_id": beneficiary_id,
        "patient_name": patient.full_name,
        "summary": summary,
    }
