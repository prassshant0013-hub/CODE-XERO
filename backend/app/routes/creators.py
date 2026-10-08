"""Creator routes for profiles, portfolios, achievements, and verifications."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.creators import CreatorProfile, PortfolioItem, CreatorAchievement, Verification
from app.schemas.creators import (
    CreatorProfileResponse,
    CreatorDetailResponse,
    CreatorProfileUpdate,
    PortfolioItemCreate,
    PortfolioItemResponse,
)
from app.dependencies import get_current_user, get_current_creator_user

router = APIRouter(prefix="/creators", tags=["creators"])


@router.get("", response_model=List[CreatorProfileResponse])
def list_creators(
    skip: int = 0,
    limit: int = 50,
    query: Optional[str] = Query(None, description="Free text search query"),
    category: Optional[str] = Query(None, description="Discipline/category filter"),
    specialization: Optional[str] = None,
    availability: Optional[str] = None,
    tools: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lists creator profiles with rich search, category, and pipeline filtering."""
    q = db.query(CreatorProfile).join(User).filter(User.is_active == True)

    if availability:
        q = q.filter(CreatorProfile.availability_status == availability)

    if specialization:
        q = q.filter(CreatorProfile.specialization.ilike(f"%{specialization}%"))

    if category and category.lower() not in ["all", "all specialties"]:
        cat_lower = category.lower().strip()
        if "ai video" in cat_lower or cat_lower == "ai videos":
            q = q.filter(
                (CreatorProfile.specialization.ilike("%video%")) |
                (CreatorProfile.specialization.ilike("%cinematic%")) |
                (CreatorProfile.specialization.ilike("%film%")) |
                (CreatorProfile.specialization.ilike("%vfx%"))
            )
        elif "ai image" in cat_lower or cat_lower == "ai images":
            q = q.filter(
                (CreatorProfile.specialization.ilike("%image%")) |
                (CreatorProfile.specialization.ilike("%photo%")) |
                (CreatorProfile.specialization.ilike("%photography%")) |
                (CreatorProfile.specialization.ilike("%still%")) |
                (CreatorProfile.specialization.ilike("%generative image%"))
            )
        elif "fashion" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%fashion%")) |
                (CreatorProfile.specialization.ilike("%couture%")) |
                (CreatorProfile.specialization.ilike("%textile%")) |
                (CreatorProfile.specialization.ilike("%lookbook%"))
            )
        elif "3d" in cat_lower or "cgi" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%3d%")) |
                (CreatorProfile.specialization.ilike("%cgi%")) |
                (CreatorProfile.specialization.ilike("%spatial%")) |
                (CreatorProfile.specialization.ilike("%render%")) |
                (CreatorProfile.specialization.ilike("%blender%")) |
                (CreatorProfile.specialization.ilike("%unreal%"))
            )
        elif "product" in cat_lower or "product ads" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%product%")) |
                (CreatorProfile.specialization.ilike("%campaign%")) |
                (CreatorProfile.specialization.ilike("%brand%")) |
                (CreatorProfile.specialization.ilike("%commercial%")) |
                (CreatorProfile.specialization.ilike("%advertising%"))
            )
        elif "social media" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%social%")) |
                (CreatorProfile.specialization.ilike("%instagram%")) |
                (CreatorProfile.specialization.ilike("%reel%")) |
                (CreatorProfile.specialization.ilike("%tiktok%")) |
                (CreatorProfile.specialization.ilike("%content%"))
            )
        elif "animation" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%animation%")) |
                (CreatorProfile.specialization.ilike("%motion%")) |
                (CreatorProfile.specialization.ilike("%animated%")) |
                (CreatorProfile.specialization.ilike("%kinetic%"))
            )
        elif "graphic design" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%graphic%")) |
                (CreatorProfile.specialization.ilike("%design%")) |
                (CreatorProfile.specialization.ilike("%typography%")) |
                (CreatorProfile.specialization.ilike("%visual%"))
            )
        elif "audio" in cat_lower or "voice" in cat_lower:
            q = q.filter(
                (CreatorProfile.specialization.ilike("%audio%")) |
                (CreatorProfile.specialization.ilike("%sonic%")) |
                (CreatorProfile.specialization.ilike("%sound%")) |
                (CreatorProfile.specialization.ilike("%voice%")) |
                (CreatorProfile.specialization.ilike("%music%"))
            )
        else:
            q = q.filter(CreatorProfile.specialization.ilike(f"%{category}%"))

    creators = q.order_by(CreatorProfile.rating.desc(), CreatorProfile.sla_score.desc()).all()

    if query and query.strip():
        import re
        raw_query = query.lower().strip()
        stopwords = {
            "find", "search", "looking", "for", "a", "an", "the", "in", "with",
            "me", "want", "need", "to", "who", "can", "make", "create", "show",
            "get", "help", "please", "some", "good", "best", "top", "of", "and", "or",
            "creator", "creators", "director", "directors", "artist", "artists"
        }
        tokens = [t for t in re.findall(r'[a-z0-9+#.-]+', raw_query) if len(t) > 1]
        meaningful_tokens = [t for t in tokens if t not in stopwords]

        # If user searched generic phrases like "find creators" or "show directors", return all
        if not meaningful_tokens:
            return creators[skip : skip + limit]

        synonym_groups = {
            "video": ["video", "cinematic", "film", "cinema", "runway", "automotive", "car", "hypercar", "camera", "director", "sora", "runway", "kling"],
            "fashion": ["fashion", "couture", "dress", "organza", "gown", "silk", "textile", "model", "lookbook", "apparel", "wear", "fabric", "drape"],
            "3d": ["3d", "motion", "spatial", "physics", "fluid", "sculpture", "chrome", "monumental", "titanium", "render", "unreal", "splatting", "nerf"],
            "audio": ["audio", "sound", "music", "sonic", "acoustic", "stems", "suno", "udio", "binaural", "holographic"],
            "brand": ["brand", "campaign", "product", "perfume", "fragrance", "luxury", "maison", "packaging", "commercial", "editorial"],
            "ai": ["midjourney", "flux", "comfyui", "sora", "runway", "magnific", "upscale", "sdxl", "lora", "latent"]
        }

        expanded_tokens = set(meaningful_tokens)
        for token in meaningful_tokens:
            for group, words in synonym_groups.items():
                if token in words:
                    expanded_tokens.update(words[:5])

        scored_creators = []
        for c in creators:
            searchable_fields = [
                c.display_name or "",
                c.specialization or "",
                c.tagline or "",
                c.location or "",
                " ".join(c.skills or []),
                " ".join(c.ai_tools or []),
                c.user.bio if c.user and c.user.bio else "",
                c.user.full_name if c.user and c.user.full_name else "",
                "creator director ai artist generative"
            ]
            if c.portfolio_items:
                for p in c.portfolio_items:
                    searchable_fields.extend([p.title or "", p.description or "", p.category or "", " ".join(p.tools_used or [])])

            searchable_text = " ".join(searchable_fields).lower()

            score = 0
            for term in meaningful_tokens:
                if term in searchable_text:
                    score += 5
                if c.display_name and term in c.display_name.lower():
                    score += 10
                if c.specialization and term in c.specialization.lower():
                    score += 8
                if c.ai_tools and any(term in str(t).lower() for t in c.ai_tools):
                    score += 6

            for exp in expanded_tokens:
                if exp in searchable_text:
                    score += 1

            if score > 0:
                scored_creators.append((score, c))

        if scored_creators:
            scored_creators.sort(key=lambda x: (x[0], x[1].rating or 0, x[1].sla_score or 0), reverse=True)
            creators = [c for _, c in scored_creators]
        else:
            creators = []

    return creators[skip : skip + limit]


@router.get("/{creator_id}", response_model=CreatorDetailResponse)
def get_creator_detail(creator_id: int, db: Session = Depends(get_db)):
    """Retrieves full creator profile details including portfolio, achievements, and verifications."""
    creator = db.query(CreatorProfile).filter(CreatorProfile.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator not found")
    return creator


@router.get("/{creator_id}/portfolio", response_model=List[PortfolioItemResponse])
def get_creator_portfolio(creator_id: int, db: Session = Depends(get_db)):
    """Retrieves portfolio items for a specific creator."""
    creator = db.query(CreatorProfile).filter(CreatorProfile.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator not found")
    return db.query(PortfolioItem).filter(PortfolioItem.creator_id == creator_id).order_by(PortfolioItem.created_at.desc()).all()


@router.put("/profile", response_model=CreatorProfileResponse)
def update_my_creator_profile(
    profile_in: CreatorProfileUpdate,
    current_user: User = Depends(get_current_creator_user),
    db: Session = Depends(get_db),
):
    """Updates the authenticated creator's profile details."""
    creator = db.query(CreatorProfile).filter(CreatorProfile.user_id == current_user.id).first()
    if not creator:
        creator = CreatorProfile(user_id=current_user.id, display_name=current_user.full_name, specialization="AI Visual Artist")
        db.add(creator)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(creator, field, value)

    db.commit()
    db.refresh(creator)
    return creator


@router.post("/portfolio", response_model=PortfolioItemResponse, status_code=status.HTTP_201_CREATED)
def add_portfolio_item(
    item_in: PortfolioItemCreate,
    current_user: User = Depends(get_current_creator_user),
    db: Session = Depends(get_db),
):
    """Adds a new portfolio item to the creator's showcase."""
    creator = db.query(CreatorProfile).filter(CreatorProfile.user_id == current_user.id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator profile not found")

    new_item = PortfolioItem(
        creator_id=creator.id,
        title=item_in.title,
        description=item_in.description,
        image_url=item_in.image_url,
        category=item_in.category,
        tools_used=item_in.tools_used,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
