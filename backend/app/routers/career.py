from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User
from app.services.ai_service import generate_career_guidance


router = APIRouter(
    prefix="/api/career",
    tags=["Career Guidance"],
)


class CareerGuidanceRequest(BaseModel):
    target_role: str
    current_skills: str
    interests: str
    areas_to_improve: str


@router.post("/guidance")
def get_career_guidance(
    request: CareerGuidanceRequest,
    current_user: User = Depends(get_current_user),
):
    if not request.target_role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target role is required.",
        )

    if not request.current_skills.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current skills are required.",
        )

    if not request.interests.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Career interests are required.",
        )

    if not request.areas_to_improve.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Areas to improve are required.",
        )

    guidance = generate_career_guidance(
        target_role=request.target_role.strip(),
        current_skills=request.current_skills.strip(),
        interests=request.interests.strip(),
        areas_to_improve=request.areas_to_improve.strip(),
    )

    return {
        "message": "Career guidance generated successfully.",
        "guidance": guidance,
    }