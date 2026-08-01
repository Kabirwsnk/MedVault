import os

from dotenv import load_dotenv
from openai import OpenAI

from app.ai.prompts import MEDICAL_SYSTEM_PROMPT
from app.ai.config import (
    OPENAI_MODEL,
    TEMPERATURE,
    MAX_TOKENS
)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def ask_openai(question: str):

    response = client.chat.completions.create(

        model=OPENAI_MODEL,

        temperature=TEMPERATURE,

        max_tokens=MAX_TOKENS,

        messages=[
            {
                "role": "system",
                "content": MEDICAL_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": question
            }
        ]
    )

    return response.choices[0].message.content