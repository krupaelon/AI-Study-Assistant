from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.resume import Resume
from app.models.performance import Performance
from app.models.user import User
from app.core.deps import get_current_user
from app.services.ai_service import (
    generate_interview_questions,
    evaluate_interview_answers,
)

router = APIRouter(
    prefix="/api/interview",
    tags=["Mock Interview"],
)


# ---------------------------------------------------------
# Request model for interview evaluation
# ---------------------------------------------------------

class InterviewEvaluationRequest(BaseModel):
    role: str
    questions: list
    answers: list


# ---------------------------------------------------------
# Start Mock Interview
# ---------------------------------------------------------

@router.post("/start")
def start_mock_interview(
    resume_id: int,
    role: str,
    difficulty: str = "medium",
    num_questions: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.owner_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    if not role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target role is required.",
        )

    allowed_difficulties = ["easy", "medium", "hard"]

    if difficulty.lower() not in allowed_difficulties:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be easy, medium, or hard.",
        )

    if num_questions < 1 or num_questions > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of questions must be between 1 and 10.",
        )

    interview = generate_interview_questions(
        resume_text=resume.extracted_text,
        role=role.strip(),
        difficulty=difficulty.lower(),
        num_questions=num_questions,
    )

    return {
        "message": "Mock interview started successfully.",
        "resume_id": resume.id,
        "file_name": resume.file_name,
        "interview": interview,
    }


# ---------------------------------------------------------
# Evaluate Mock Interview
# ---------------------------------------------------------

@router.post("/evaluate")
def evaluate_mock_interview(
    request: InterviewEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target role is required.",
        )

    if not request.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview questions are required.",
        )

    if not request.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview answers are required.",
        )

    # Generate AI evaluation
    evaluation = evaluate_interview_answers(
        role=request.role.strip(),
        questions=request.questions,
        answers=request.answers,
    )

    # ---------------------------------------------------------
    # Save interview score to Performance table
    # ---------------------------------------------------------

    overall_score = evaluation.get("overall_score")

    if overall_score is not None:
        performance = Performance(
            owner_id=current_user.id,
            category="interview",
            title=f"{request.role.strip()} Mock Interview",
            score=float(overall_score),
        )

        db.add(performance)
        db.commit()
        db.refresh(performance)

        performance_id = performance.id
    else:
        performance_id = None

    return {
        "message": "Interview evaluated successfully.",
        "evaluation": evaluation,
        "performance_id": performance_id,
    }