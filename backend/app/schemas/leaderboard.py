from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.creators import CreatorProfileResponse


class LeaderboardResponse(BaseModel):
    id: int
    creator_id: int
    category: str
    score: float
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    created_at: datetime
    creator: Optional[CreatorProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)
