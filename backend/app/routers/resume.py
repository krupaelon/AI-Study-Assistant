from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.resume import Resume
from app.models.performance import Performance
from app.models.user import User
from app.services.file_extraction import extract_text
from app.services.ai_service import analyze_resume, match_resume_to_job


router = APIRouter(prefix="/api/resume", tags=["Resume"])


# ============================================================
# 1. UPLOAD RESUME
# ============================================================

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Read uploaded file
    file_bytes = await file.read()

    # Check file size
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File exceeds the maximum allowed size of "
                f"{settings.MAX_UPLOAD_SIZE_MB}MB."
            ),
        )

    # Extract text from resume
    extracted_text, file_ext = extract_text(
        file.filename,
        file_bytes,
    )

    # Allow only PDF resumes for now
    if file_ext.lower() != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload your resume as a PDF file.",
        )

    # Save resume
    resume = Resume(
        file_name=file.filename,
        extracted_text=extracted_text,
        owner_id=current_user.id,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "message": "Resume uploaded successfully.",
        "resume_id": resume.id,
        "file_name": resume.file_name,
        "text_length": len(resume.extracted_text),
    }


# ============================================================
# 2. ANALYZE RESUME
# ============================================================

@router.post("/{resume_id}/analyze")
def analyze_uploaded_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find resume belonging to current user
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

    # Make sure text was extracted
    if not resume.extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text could be extracted from this resume.",
        )

    # Analyze resume using AI
    analysis_result = analyze_resume(
        resume.extracted_text
    )

    # Save analysis as JSON text
    import json

    resume.analysis = json.dumps(
        analysis_result
    )

    db.commit()
    db.refresh(resume)

    # ---------------------------------------------------------
    # Save ATS score to Performance table
    # ---------------------------------------------------------

    ats_score = analysis_result.get("ats_score")

    if ats_score is not None:
        performance = Performance(
            owner_id=current_user.id,
            category="resume",
            title=f"Resume ATS - {resume.file_name}",
            score=float(ats_score),
        )

        db.add(performance)
        db.commit()
        db.refresh(performance)

        performance_id = performance.id
    else:
        performance_id = None

    return {
        "message": "Resume analyzed successfully.",
        "resume_id": resume.id,
        "analysis": analysis_result,
        "performance_id": performance_id,
    }


# ============================================================
# 3. MATCH RESUME WITH JOB DESCRIPTION
# ============================================================

@router.post("/{resume_id}/match-job")
def match_resume_with_job(
    resume_id: int,
    job_description: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find resume belonging to current user
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

    # Make sure text was extracted
    if not resume.extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text could be extracted from this resume.",
        )

    # Make sure job description is provided
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty.",
        )

    # Match resume with job description using AI
    match_result = match_resume_to_job(
        resume.extracted_text,
        job_description,
    )

    return {
        "message": "Resume matched with job successfully.",
        "resume_id": resume_id,
        "match_result": match_result,
    }