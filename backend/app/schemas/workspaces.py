from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.users import UserResponse
from app.schemas.briefs import BriefResponse


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    workspace_id: int
    sender_id: int
    content: str  # Decrypted content presented to client
    created_at: datetime
    sender: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class RevisionCreate(BaseModel):
    milestone_id: Optional[int] = None
    description: str


class RevisionResponse(BaseModel):
    id: int
    milestone_id: Optional[int] = None
    workspace_id: int
    requester_id: int
    description: str
    status: str
    created_at: datetime
    requester: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float = 0.0
    estimated_date: Optional[datetime] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None  # pending, approved, in_review, released
    estimated_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class MilestoneResponse(BaseModel):
    id: int
    workspace_id: int
    title: str
    description: Optional[str] = None
    amount: float
    status: str
    estimated_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    revisions: List[RevisionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class FileResponse(BaseModel):
    id: int
    workspace_id: int
    uploader_id: int
    filename: str
    file_size: Optional[str] = None
    file_type: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    uploader: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class WorkspaceCreate(BaseModel):
    brief_id: Optional[int] = None
    creator_user_id: int
    title: str
    initial_milestones: Optional[List[MilestoneCreate]] = None


class WorkspaceResponse(BaseModel):
    id: int
    brief_id: Optional[int] = None
    brand_user_id: int
    creator_user_id: int
    title: str
    status: str
    created_at: datetime
    brand_user: Optional[UserResponse] = None
    creator_user: Optional[UserResponse] = None
    brief: Optional[BriefResponse] = None
    milestones: List[MilestoneResponse] = []

    model_config = ConfigDict(from_attributes=True)


class WorkspaceDetailResponse(WorkspaceResponse):
    milestones: List[MilestoneResponse] = []
    messages: List[MessageResponse] = []
    files: List[FileResponse] = []
    revisions: List[RevisionResponse] = []

    model_config = ConfigDict(from_attributes=True)
