from app.ai.config import AI_PROVIDER

from app.ai.openai_service import ask_openai


def ask_ai(question: str):

    if AI_PROVIDER == "openai":
        return ask_openai(question)

    raise ValueError(
        f"Unsupported AI provider: {AI_PROVIDER}"
    )