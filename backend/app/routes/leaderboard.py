"""Director & Creator Leaderboard routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.leaderboard import LeaderboardEntry
from app.schemas.leaderboard import LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=List[LeaderboardResponse])
def get_leaderboard(
    category: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Retrieves director rankings across categories: creator_of_week, most_trusted, best_ai_video, etc."""
    query = db.query(LeaderboardEntry)
    if category:
        query = query.filter(LeaderboardEntry.category == category)

    return query.order_by(LeaderboardEntry.score.desc()).limit(limit).all()
