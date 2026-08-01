from fastapi import APIRouter

from app.ai.symptom_checker import analyze_symptoms

from app.ai.provider import ask_ai

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
def ai_chat(question: str):

    answer = ask_ai(question)

    return {
        "question": question,
        "answer": answer
    }