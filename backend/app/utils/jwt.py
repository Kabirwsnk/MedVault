from datetime import (
    datetime,
    timedelta,
    timezone,
)

from jose import jwt

from app.config import (
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)

SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = JWT_ACCESS_TOKEN_EXPIRE_MINUTES


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update(
        {"exp": expire}
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt
