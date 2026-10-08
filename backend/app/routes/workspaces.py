"""Workspace collaboration, milestones, encrypted messaging, and revision requests."""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.workspaces import (
    Workspace,
    WorkspaceMember,
    WorkspaceMessage,
    WorkspaceMilestone,
    SharedFile,
    RevisionRequest,
)
from app.schemas.workspaces import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceDetailResponse,
    MessageCreate,
    MessageResponse,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
    RevisionCreate,
    RevisionResponse,
)
from app.dependencies import get_current_user
from app.services.encryption import encrypt_message, decrypt_message

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
def list_my_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lists all active collaboration workspaces the current user participates in."""
    workspaces = db.query(Workspace).filter(
        (Workspace.brand_user_id == current_user.id) |
        (Workspace.creator_user_id == current_user.id) |
        (Workspace.id.in_(
            db.query(WorkspaceMember.workspace_id).filter(WorkspaceMember.user_id == current_user.id)
        ))
    ).order_by(Workspace.created_at.desc()).all()
    return workspaces


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    ws_in: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new collaboration workspace between brand and creator."""
    creator_user = db.query(User).filter(User.id == ws_in.creator_user_id).first()
    if not creator_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator user not found")

    workspace = Workspace(
        brief_id=ws_in.brief_id,
        brand_user_id=current_user.id,
        creator_user_id=ws_in.creator_user_id,
        title=ws_in.title,
        status="discovery",
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # Add workspace members
    m1 = WorkspaceMember(workspace_id=workspace.id, user_id=current_user.id, role="brand")
    m2 = WorkspaceMember(workspace_id=workspace.id, user_id=creator_user.id, role="creator")
    db.add_all([m1, m2])

    # Add initial milestones if provided
    if ws_in.initial_milestones:
        for m in ws_in.initial_milestones:
            db.add(WorkspaceMilestone(
                workspace_id=workspace.id,
                title=m.title,
                description=m.description,
                amount=m.amount,
                status="pending",
                estimated_date=m.estimated_date,
            ))
    else:
        # Default milestones
        db.add(WorkspaceMilestone(
            workspace_id=workspace.id,
            title="Discovery & Concept Art",
            description="Initial style frames and prompt tests",
            amount=500.0,
            status="approved",
        ))
        db.add(WorkspaceMilestone(
            workspace_id=workspace.id,
            title="Rough Cut & Motion Pass",
            description="First pass video generation and pacing",
            amount=1000.0,
            status="pending",
        ))
        db.add(WorkspaceMilestone(
            workspace_id=workspace.id,
            title="Final 4K Master & Audio Stems",
            description="Final upscaled render and sound design",
            amount=1000.0,
            status="pending",
        ))

    # Send welcome automated encrypted message
    welcome_msg = WorkspaceMessage(
        workspace_id=workspace.id,
        sender_id=current_user.id,
        encrypted_content=encrypt_message(f"Welcome to the workspace '{workspace.title}'. Brief and milestones are loaded."),
    )
    db.add(welcome_msg)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceDetailResponse)
def get_workspace_detail(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves full details of a workspace, including milestones, decrypted messages, files, and revisions."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # Authorize member
    is_member = (
        workspace.brand_user_id == current_user.id or
        workspace.creator_user_id == current_user.id or
        current_user.role == "admin"
    )
    if not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden to this workspace")

    # Decrypt messages
    raw_messages = db.query(WorkspaceMessage).filter(WorkspaceMessage.workspace_id == workspace_id).order_by(WorkspaceMessage.created_at.asc()).all()
    decrypted_messages = [
        MessageResponse(
            id=m.id,
            workspace_id=m.workspace_id,
            sender_id=m.sender_id,
            content=decrypt_message(m.encrypted_content),
            created_at=m.created_at,
            sender=m.sender,
        )
        for m in raw_messages
    ]

    return WorkspaceDetailResponse(
        id=workspace.id,
        brief_id=workspace.brief_id,
        brand_user_id=workspace.brand_user_id,
        creator_user_id=workspace.creator_user_id,
        title=workspace.title,
        status=workspace.status,
        created_at=workspace.created_at,
        brand_user=workspace.brand_user,
        creator_user=workspace.creator_user,
        brief=workspace.brief,
        milestones=workspace.milestones,
        messages=decrypted_messages,
        files=workspace.files,
        revisions=workspace.revisions,
    )


@router.post("/{workspace_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_workspace_message(
    workspace_id: int,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends an encrypted message in a collaboration workspace."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    encrypted_text = encrypt_message(msg_in.content)
    message = WorkspaceMessage(
        workspace_id=workspace.id,
        sender_id=current_user.id,
        encrypted_content=encrypted_text,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return MessageResponse(
        id=message.id,
        workspace_id=message.workspace_id,
        sender_id=message.sender_id,
        content=msg_in.content,
        created_at=message.created_at,
        sender=current_user,
    )


@router.get("/{workspace_id}/messages", response_model=List[MessageResponse])
def get_workspace_messages(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves decrypted message stream for a workspace."""
    raw_messages = db.query(WorkspaceMessage).filter(
        WorkspaceMessage.workspace_id == workspace_id
    ).order_by(WorkspaceMessage.created_at.asc()).all()

    return [
        MessageResponse(
            id=m.id,
            workspace_id=m.workspace_id,
            sender_id=m.sender_id,
            content=decrypt_message(m.encrypted_content),
            created_at=m.created_at,
            sender=m.sender,
        )
        for m in raw_messages
    ]


@router.put("/{workspace_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    workspace_id: int,
    milestone_id: int,
    milestone_in: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates milestone status (e.g. approved, in_review, released)."""
    milestone = db.query(WorkspaceMilestone).filter(
        WorkspaceMilestone.id == milestone_id,
        WorkspaceMilestone.workspace_id == workspace_id,
    ).first()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    update_data = milestone_in.model_dump(exclude_unset=True)
    if update_data.get("status") == "released" and not milestone.completed_at:
        milestone.completed_at = datetime.utcnow()

    for field, val in update_data.items():
        setattr(milestone, field, val)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.post("/{workspace_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def add_milestone(
    workspace_id: int,
    milestone_in: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Adds a new milestone to a workspace."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    milestone = WorkspaceMilestone(
        workspace_id=workspace.id,
        title=milestone_in.title,
        description=milestone_in.description,
        amount=milestone_in.amount,
        status="pending",
        estimated_date=milestone_in.estimated_date,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.post("/{workspace_id}/revision-requests", response_model=RevisionResponse, status_code=status.HTTP_201_CREATED)
def request_revision(
    workspace_id: int,
    rev_in: RevisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submits a formal revision request on a milestone or overall workspace."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    rev = RevisionRequest(
        workspace_id=workspace.id,
        milestone_id=rev_in.milestone_id,
        requester_id=current_user.id,
        description=rev_in.description,
        status="open",
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev
