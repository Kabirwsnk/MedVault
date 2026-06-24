from fastapi import APIRouter

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.get("/")
def test():
    return {
        "message": "Patients Router Working"
    }