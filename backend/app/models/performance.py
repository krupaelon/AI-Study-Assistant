from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Performance(Base):
    """
    Stores performance scores generated from different modules.
    """

    __tablename__ = "performance"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Source of the performance record:
    # "quiz" | "resume" | "interview" | "communication"
    category = Column(String(50), nullable=False)

    # Optional title for identifying the attempt
    title = Column(String(255), nullable=True)

    # Main score for this performance record
    score = Column(Float, nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    owner = relationship(
        "User",
        back_populates="performance_records",
    )