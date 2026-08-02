from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db

from app.ai.symptom_checker import analyze_symptoms
from app.ai.provider import ask_ai
from app.ai.context_builder import build_patient_context


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.get("/")
def ai_home():
    return {
        "message": "MedVault AI Module Running"
    }


@router.get("/symptom-checker")
def symptom_checker(symptoms: str):

    result = analyze_symptoms(symptoms)

    return result


@router.get("/chat")
def ai_chat(
    beneficiary_id: str,
    question: str,
    db: Session = Depends(get_db)
):

    context = build_patient_context(
        beneficiary_id,
        db
    )

    answer = ask_ai(
        question,
        context
    )

    return {
        "beneficiary_id": beneficiary_id,
        "question": question,
        "answer": answer
    }