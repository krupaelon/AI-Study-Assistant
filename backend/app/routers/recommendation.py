from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.performance import Performance
from app.models.user import User
from app.services.recommendation_service import generate_recommendations


router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendation Engine"],
)


@router.get("/")
def get_recommendations(
    target_role: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Performance)
        .filter(Performance.owner_id == current_user.id)
        .order_by(Performance.created_at.desc())
        .all()
    )

    # Group performance scores by category
    category_data = {}

    for record in records:
        if record.category not in category_data:
            category_data[record.category] = []

        category_data[record.category].append(record.score)

    # Calculate category averages
    category_summary = []

    for category, scores in category_data.items():
        category_summary.append(
            {
                "category": category,
                "average_score": round(
                    sum(scores) / len(scores),
                    2,
                ),
                "attempts": len(scores),
                "best_score": max(scores),
            }
        )

    performance_data = {
        "total_records": len(records),
        "category_summary": category_summary,
    }

    result = generate_recommendations(
        performance_data=performance_data,
        target_role=target_role,
    )

    return {
        "message": "Personalized recommendations generated successfully.",
        "overall_recommendation": result["overall_recommendation"],
        "recommendations": result["recommendations"],
    }