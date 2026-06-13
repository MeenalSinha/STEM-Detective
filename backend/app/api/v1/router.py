from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.cases import router as cases_router
from app.api.v1.endpoints.lab import router as lab_router
from app.api.v1.endpoints.other import (
    evidence_router,
    user_router,
    leaderboard_router,
    teacher_router,
)

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(cases_router, prefix="/cases", tags=["Cases & Mysteries"])
api_router.include_router(lab_router, prefix="/lab", tags=["STEM Crime Lab"])
api_router.include_router(evidence_router, prefix="/evidence", tags=["Evidence"])
api_router.include_router(user_router, prefix="/users", tags=["Users & Stats"])
api_router.include_router(leaderboard_router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(teacher_router, prefix="/teacher", tags=["Teacher Dashboard"])

from app.api.v1.endpoints.quiz import router as quiz_router
api_router.include_router(quiz_router, prefix="/quiz", tags=["Proof of Learning"])
