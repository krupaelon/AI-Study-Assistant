from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.performance import Performance
from app.models.user import User
from app.services.ai_service import analyze_communication


router = APIRouter(
    prefix="/api/communication",
    tags=["Communication Feedback"],
)


class CommunicationRequest(BaseModel):
    answer: str


@router.post("/analyze")
def analyze_communication_answer(
    request: CommunicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.answer.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer is required.",
        )

    if len(request.answer.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a longer answer for meaningful feedback.",
        )

    # Generate AI communication feedback
    feedback = analyze_communication(request.answer.strip())

    # ---------------------------------------------------------
    # Save communication score to Performance table
    # ---------------------------------------------------------

    overall_score = feedback.get("overall_score")

    if overall_score is not None:
        performance = Performance(
            owner_id=current_user.id,
            category="communication",
            title="Communication Feedback",
            score=float(overall_score),
        )

        db.add(performance)
        db.commit()
        db.refresh(performance)

        performance_id = performance.id
    else:
        performance_id = None

    return {
        "message": "Communication analyzed successfully.",
        "feedback": feedback,
        "performance_id": performance_id,
    }