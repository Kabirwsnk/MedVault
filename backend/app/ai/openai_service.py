import os

from dotenv import load_dotenv

from app.ai.config import (
    MAX_TOKENS,
    OPENAI_MODEL,
    TEMPERATURE,
)
from app.ai.prompts import MEDICAL_SUMMARY_PROMPT, MEDICAL_SYSTEM_PROMPT

load_dotenv()


def _get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key)
    except Exception:
        return None


def ask_openai(
    question: str,
    context: str,
) -> str:
    client = _get_client()
    if not client:
        return (
            "AI Assistant (Offline Mode): OpenAI API key is not configured. "
            f"Context received for analysis: {len(context)} characters. Question: {question}"
        )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        messages=[
            {
                "role": "system",
                "content": MEDICAL_SYSTEM_PROMPT,
            },
            {
                "role": "system",
                "content": context,
            },
            {
                "role": "user",
                "content": question,
            },
        ],
    )

    return response.choices[0].message.content


def summarize_with_openai(
    context: str,
) -> str:
    client = _get_client()
    if not client:
        return (
            "### MedVault AI Clinical Summary (Standard Generated Summary)\n\n"
            "**Notice**: Live OpenAI integration is pending `OPENAI_API_KEY` configuration. "
            "Below is the parsed clinical summary based on local records:\n\n"
            f"{context}\n\n"
            "---\n*Disclaimer: This summary is generated for informational purposes. Please consult a licensed medical doctor.*"
        )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        messages=[
            {
                "role": "system",
                "content": MEDICAL_SUMMARY_PROMPT,
            },
            {
                "role": "user",
                "content": f"Please summarize the following patient medical records:\n\n{context}",
            },
        ],
    )

    return response.choices[0].message.content