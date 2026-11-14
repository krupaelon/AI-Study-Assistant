from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.performance import Performance
from app.models.user import User


router = APIRouter(
    prefix="/api/performance",
    tags=["Performance Analytics"],
)


@router.get("/")
def get_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Performance)
        .filter(Performance.owner_id == current_user.id)
        .order_by(Performance.created_at.desc())
        .all()
    )

    # No performance records yet
    if not records:
        return {
            "total_records": 0,
            "average_score": 0,
            "best_category": None,
            "weakest_category": None,
            "category_summary": [],
            "recent_records": [],
        }

    # Overall average
    average_score = round(
        sum(record.score for record in records) / len(records),
        2,
    )

    # Group scores by category
    category_scores = defaultdict(list)

    for record in records:
        category_scores[record.category].append(record.score)

    category_summary = []

    for category, scores in category_scores.items():
        category_summary.append(
            {
                "category": category,
                "average_score": round(sum(scores) / len(scores), 2),
                "attempts": len(scores),
                "best_score": max(scores),
            }
        )

    # Find best and weakest categories
    best_category = max(
        category_summary,
        key=lambda item: item["average_score"],
    )

    weakest_category = min(
        category_summary,
        key=lambda item: item["average_score"],
    )

    # Recent performance records
    recent_records = [
        {
            "id": record.id,
            "category": record.category,
            "title": record.title,
            "score": record.score,
            "created_at": record.created_at,
        }
        for record in records[:10]
    ]

    return {
        "total_records": len(records),
        "average_score": average_score,
        "best_category": best_category,
        "weakest_category": weakest_category,
        "category_summary": category_summary,
        "recent_records": recent_records,
    }