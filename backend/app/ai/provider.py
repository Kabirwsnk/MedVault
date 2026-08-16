from app.ai.config import AI_PROVIDER
from app.ai.openai_service import ask_openai, summarize_with_openai


def ask_ai(
    question: str,
    context: str,
) -> str:
    if AI_PROVIDER == "openai":
        return ask_openai(
            question,
            context,
        )

    raise ValueError(
        f"Unsupported AI provider: {AI_PROVIDER}"
    )


def summarize_ai(
    context: str,
) -> str:
    if AI_PROVIDER == "openai":
        return summarize_with_openai(
            context,
        )

    raise ValueError(
        f"Unsupported AI provider: {AI_PROVIDER}"
    )