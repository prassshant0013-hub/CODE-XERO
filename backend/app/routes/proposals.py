from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.creators import CreatorProfile
from app.models.proposals import Proposal
from app.models.workspaces import Workspace, WorkspaceMember, WorkspaceMilestone, WorkspaceMessage
from app.models.notifications import Notification
from app.schemas.proposals import ProposalCreate, ProposalResponse
from app.dependencies import get_current_user
from app.services.encryption import encrypt_message

router = APIRouter(prefix="/proposals", tags=["proposals"])


def _serialize_proposal(p: Proposal, db: Session) -> ProposalResponse:
    brand = db.query(User).filter(User.id == p.brand_user_id).first()
    creator = db.query(User).filter(User.id == p.creator_user_id).first()
    creator_prof = db.query(CreatorProfile).filter(CreatorProfile.user_id == p.creator_user_id).first()

    recruiter_name = brand.full_name if brand else "Recruiter"
    creator_name = (creator_prof.display_name if creator_prof else None) or (creator.full_name if creator else "Creator")
    creator_avatar = (creator.avatar_url if creator else None)

    return ProposalResponse(
        id=p.id,
        brand_user_id=p.brand_user_id,
        creator_user_id=p.creator_user_id,
        workspace_id=p.workspace_id,
        project_title=p.project_title,
        project_requirement=p.project_requirement,
        budget_in_rupees=p.budget_in_rupees,
        deadline=p.deadline,
        status=p.status,
        created_at=p.created_at,
        recruiter_name=recruiter_name,
        creator_name=creator_name,
        creator_avatar=creator_avatar,
    )


@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(
    proposal_in: ProposalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submits a hiring proposal to a creator with status=pending and sends notification."""
    creator_user_id = None
    target_id = proposal_in.creator_id.strip()

    if target_id.isdigit():
        target_int = int(target_id)
        prof_match = db.query(CreatorProfile).filter(CreatorProfile.id == target_int).first()
        if prof_match:
            creator_user_id = prof_match.user_id
        else:
            user_match = db.query(User).filter(User.id == target_int, User.role == "creator").first()
            if user_match:
                creator_user_id = user_match.id

    if not creator_user_id:
        prof = db.query(CreatorProfile).filter(
            CreatorProfile.display_name.ilike(target_id.replace('-', ' '))
        ).first()
        if prof:
            creator_user_id = prof.user_id

    if not creator_user_id:
        fallback_prof = db.query(CreatorProfile).first()
        creator_user_id = fallback_prof.user_id if fallback_prof else current_user.id

    proposal = Proposal(
        brand_user_id=current_user.id,
        creator_user_id=creator_user_id,
        project_title=proposal_in.project_title,
        project_requirement=proposal_in.project_requirement,
        budget_in_rupees=proposal_in.budget_in_rupees,
        deadline=proposal_in.deadline,
        status="pending",
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    # Notify creator about incoming project proposal
    notif = Notification(
        user_id=creator_user_id,
        title="New Project Proposal",
        message=f"{current_user.full_name} sent you a proposal for '{proposal.project_title}' (Budget: ₹{proposal.budget_in_rupees:,.0f}).",
        link="/requests",
        type="proposal_received",
    )
    db.add(notif)
    db.commit()

    return _serialize_proposal(proposal, db)


@router.get("", response_model=List[ProposalResponse])
def get_my_proposals(
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists proposals associated with current user (as recruiter or creator)."""
    query = db.query(Proposal)
    if role == "creator" or (role is None and current_user.role == "creator"):
        query = query.filter(Proposal.creator_user_id == current_user.id)
    elif role == "brand":
        query = query.filter(Proposal.brand_user_id == current_user.id)
    else:
        query = query.filter(
            (Proposal.brand_user_id == current_user.id) |
            (Proposal.creator_user_id == current_user.id)
        )
    proposals = query.order_by(Proposal.created_at.desc()).all()
    return [_serialize_proposal(p, db) for p in proposals]


@router.post("/{proposal_id}/accept", response_model=ProposalResponse)
def accept_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creator accepts proposal.
    Updates status to 'accepted', creates workspace linked only to recruiter and creator,
    and dispatches a notification to the recruiter.
    Idempotent: will not create duplicate workspaces if Accept is clicked multiple times.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    if proposal.creator_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned creator can accept this proposal")

    if proposal.status == "accepted" and proposal.workspace_id:
        # Already accepted and workspace exists — return without duplicating
        return _serialize_proposal(proposal, db)

    proposal.status = "accepted"

    # Check if a workspace already exists for this proposal
    workspace = None
    if proposal.workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == proposal.workspace_id).first()

    if not workspace:
        # Create a new workspace linked only to that recruiter and creator
        workspace = Workspace(
            brand_user_id=proposal.brand_user_id,
            creator_user_id=proposal.creator_user_id,
            title=proposal.project_title,
            status="discovery",
        )
        db.add(workspace)
        db.commit()
        db.refresh(workspace)

        proposal.workspace_id = workspace.id

        # Add workspace members
        m_brand = WorkspaceMember(workspace_id=workspace.id, user_id=proposal.brand_user_id, role="brand")
        m_creator = WorkspaceMember(workspace_id=workspace.id, user_id=proposal.creator_user_id, role="creator")
        db.add_all([m_brand, m_creator])

        # Add initial milestone with the agreed budget
        milestone = WorkspaceMilestone(
            workspace_id=workspace.id,
            title="Initial Concept & Deliverables Delivery",
            description=proposal.project_requirement[:250],
            amount=proposal.budget_in_rupees,
            status="approved",
        )
        db.add(milestone)

        # Welcome message
        welcome_msg = WorkspaceMessage(
            workspace_id=workspace.id,
            sender_id=current_user.id,
            encrypted_content=encrypt_message(f"Proposal accepted for '{proposal.project_title}'. Welcome to our dedicated workspace!"),
        )
        db.add(welcome_msg)

    # Create notification for recruiter
    notif = Notification(
        user_id=proposal.brand_user_id,
        title="Proposal Accepted",
        message=f"{current_user.full_name} accepted your proposal for '{proposal.project_title}'. Your workspace is ready!",
        link=f"/workspaces?id={workspace.id}",
        type="proposal_accepted",
    )
    db.add(notif)
    db.commit()
    db.refresh(proposal)

    return _serialize_proposal(proposal, db)


@router.post("/{proposal_id}/decline", response_model=ProposalResponse)
def decline_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creator declines proposal.
    Updates status to 'declined', creates NO workspace, and notifies recruiter.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    if proposal.creator_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned creator can decline this proposal")

    proposal.status = "declined"

    # Create notification for recruiter
    notif = Notification(
        user_id=proposal.brand_user_id,
        title="Proposal Declined",
        message=f"{current_user.full_name} declined your proposal for '{proposal.project_title}'.",
        link="/discover",
        type="proposal_declined",
    )
    db.add(notif)
    db.commit()
    db.refresh(proposal)

    return _serialize_proposal(proposal, db)
