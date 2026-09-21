from fastapi import APIRouter, Depends

from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
async def get_me(
    current_user=Depends(get_current_user)
):
    # Keep the profile endpoint async so authenticated SPA startup does not block the event loop.
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }