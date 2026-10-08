"""Creator Matching & Recommendation Engine for CODE XERO AI Creator Marketplace.

Priority Matching Order:
1. Creator Category & Specialization (40 pts)
2. Tools & Tags Match (25 pts)
3. Style & Creative Direction Match (15 pts)
4. Starting Price vs Project Budget (10 pts)
5. Availability (5 pts)
6. Rating & SLA Score (5 pts)
"""

from typing import List, Dict, Any, Tuple, Optional
from app.models.creators import CreatorProfile
from app.models.briefs import Brief


CATEGORY_KEYWORDS = {
    "AI Images": ["image", "photo", "photography", "portrait", "still", "generative image", "pixel", "illustration", "stills"],
    "AI Videos": ["video", "cinematic", "film", "motion", "reel", "vfx", "short", "director", "commercial film"],
    "3D & CGI": ["3d", "cgi", "render", "spatial", "blender", "unreal", "cinema 4d", "v-ray", "houdini", "redshift"],
    "Product Ads": ["product", "ad", "campaign", "commercial", "ecommerce", "brand", "packaging", "advertising"],
    "Fashion": ["fashion", "couture", "apparel", "lookbook", "textile", "runway", "model", "silk", "wear"],
    "Social Media": ["social", "reels", "tiktok", "instagram", "viral", "short", "content creator"],
    "Animation": ["animation", "motion", "animated", "kinetic", "motion graphics"],
    "Graphic Design": ["graphic", "design", "typography", "branding", "print", "visual", "poster", "identity"],
    "Audio & Voice": ["audio", "sound", "voice", "music", "sonic", "podcast", "suno", "elevenlabs"],
}


def recommend_top_creators(
    category: str,
    content_type: str = "",
    style: str = "",
    tools_suggested: Optional[List[str]] = None,
    budget: float = 0.0,
    budget_min: float = 0.0,
    budget_max: float = 0.0,
    timeline_days: int = 7,
    description: str = "",
    creators: Optional[List[CreatorProfile]] = None,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    """Calculates deterministic matching scores and builds human-readable explanations.
    
    Priority matching:
    1. Category (40 pts)
    2. Tools / Tags (25 pts)
    3. Style (15 pts)
    4. Budget fit (10 pts)
    5. Availability (5 pts)
    6. Rating & SLA (5 pts)
    """
    if not creators:
        return []

    tools_suggested = [t.strip() for t in (tools_suggested or []) if t.strip()]
    target_budget = budget_max if budget_max > 0 else (budget if budget > 0 else budget_min)

    scored_list = []
    for creator in creators:
        score_breakdown, recommendation_reason, match_reasons, total_score = score_creator_for_recommendation(
            creator=creator,
            target_category=category or "AI Videos",
            content_type=content_type or "",
            style=style or "",
            tools_suggested=tools_suggested,
            budget=target_budget,
            timeline_days=timeline_days,
            description=description,
        )

        scored_list.append({
            "creator": creator,
            "match_score": int(round(total_score)),
            "recommendation_reason": recommendation_reason,
            "match_reasons": match_reasons,
            "score_breakdown": score_breakdown,
        })

    # Sort descending by match score, then rating, then SLA
    scored_list.sort(
        key=lambda x: (x["match_score"], x["creator"].rating or 0, x["creator"].sla_score or 0),
        reverse=True
    )
    return scored_list[:limit]


def score_creator_for_recommendation(
    creator: CreatorProfile,
    target_category: str,
    content_type: str,
    style: str,
    tools_suggested: List[str],
    budget: float,
    timeline_days: int,
    description: str,
) -> Tuple[Dict[str, float], str, List[str], float]:
    match_reasons = []

    # 1. Category Match (40 pts max)
    cat_keywords = CATEGORY_KEYWORDS.get(target_category, [target_category.lower()])
    spec_lower = (creator.specialization or "").lower()
    tagline_lower = (creator.tagline or "").lower()

    category_score = 0.0
    direct_category_match = False
    for kw in cat_keywords:
        if kw in spec_lower or kw in tagline_lower:
            category_score = 40.0
            direct_category_match = True
            match_reasons.append(f"Specializes in {target_category} ({creator.specialization})")
            break

    if not direct_category_match:
        # Check portfolio items
        if creator.portfolio_items:
            for p in creator.portfolio_items:
                if any(kw in (p.category or "").lower() or kw in (p.title or "").lower() for kw in cat_keywords):
                    category_score = 28.0
                    match_reasons.append(f"Portfolio includes {target_category} works")
                    break

    if category_score == 0.0:
        category_score = 5.0  # base fallback

    # 2. Tools Overlap (25 pts max)
    creator_tools = [t.lower() for t in (creator.ai_tools or [])]
    matched_tools = []
    tools_score = 0.0

    if tools_suggested:
        for st in tools_suggested:
            st_clean = st.lower().replace("flux.1", "flux").replace("v6", "").strip()
            for ct in (creator.ai_tools or []):
                ct_clean = ct.lower().replace("flux.1", "flux").replace("v6", "").strip()
                if st_clean in ct_clean or ct_clean in st_clean:
                    if ct not in matched_tools:
                        matched_tools.append(ct)

        if matched_tools:
            ratio = len(matched_tools) / max(1, len(tools_suggested))
            tools_score = min(25.0, round(ratio * 25.0, 1) + (len(matched_tools) * 3.0))
            tools_score = min(25.0, tools_score)
            match_reasons.append(f"Proficient in {', '.join(matched_tools[:3])}")
        else:
            tools_score = 8.0
    else:
        tools_score = 15.0

    # 3. Style Match (15 pts max)
    style_score = 0.0
    if style:
        style_tokens = [w.lower().strip() for w in style.replace(",", " ").split() if len(w) > 3]
        creator_text = f"{spec_lower} {tagline_lower} {' '.join(creator.skills or [])}".lower()
        matched_style_words = [w for w in style_tokens if w in creator_text]
        if matched_style_words:
            style_score = min(15.0, 8.0 + len(matched_style_words) * 3.5)
            match_reasons.append(f"Aesthetic match for {style}")
        else:
            style_score = 8.0
    else:
        style_score = 10.0

    # 4. Starting Price vs Budget (10 pts max)
    price_score = 0.0
    creator_rate = creator.starting_rate or 25000.0
    if budget > 0:
        if creator_rate <= budget:
            price_score = 10.0
            match_reasons.append(f"Fits within budget (Starting at ₹{int(creator_rate):,})")
        elif creator_rate <= budget * 1.25:
            price_score = 6.0
        else:
            price_score = 2.0
    else:
        price_score = 8.0

    # 5. Availability (5 pts max)
    avail = (creator.availability_status or "available").lower()
    if avail == "available":
        avail_score = 5.0
    elif avail == "busy":
        avail_score = 2.5
    else:
        avail_score = 1.0

    # 6. Rating & SLA (5 pts max)
    rating_val = creator.rating or 4.8
    sla_val = creator.sla_score or 98.0
    rating_score = round((rating_val / 5.0) * 3.0 + (sla_val / 100.0) * 2.0, 1)
    rating_score = min(5.0, rating_score)

    total_score = min(100.0, category_score + tools_score + style_score + price_score + avail_score + rating_score)

    score_breakdown = {
        "style_match": style_score,
        "tools_match": tools_score,
        "skills_match": category_score,
        "availability_match": avail_score,
        "delivery_match": price_score,
        "rights_match": rating_score,
        "portfolio_match": 5.0,
    }

    # Construct the clear human-readable explanation
    # E.g.: "Recommended because this creator specializes in AI Images, uses Flux and Midjourney, and fits your ₹60,000 project budget."
    tools_phrase = ""
    highlight_tools = matched_tools if matched_tools else (creator.ai_tools[:2] if creator.ai_tools else ["AI Creative Suites"])
    clean_tool_names = [t.replace(".1", "").replace(" v6", "") for t in highlight_tools[:2]]
    if len(clean_tool_names) == 1:
        tools_phrase = clean_tool_names[0]
    elif len(clean_tool_names) >= 2:
        tools_phrase = f"{clean_tool_names[0]} and {clean_tool_names[1]}"

    budget_phrase = ""
    if budget > 0 and creator_rate <= budget:
        budget_phrase = f"fits your ₹{int(budget):,} project budget"
    elif budget > 0:
        budget_phrase = f"offers starting rate at ₹{int(creator_rate):,}"
    else:
        budget_phrase = f"maintains a {creator.rating}★ rating"

    spec_label = target_category if direct_category_match else (creator.specialization.split("&")[0].strip())
    if tools_phrase:
        recommendation_reason = f"Recommended because this creator specializes in {spec_label}, uses {tools_phrase}, and {budget_phrase}."
    else:
        recommendation_reason = f"Recommended because this creator specializes in {spec_label} and {budget_phrase}."

    return score_breakdown, recommendation_reason, match_reasons, total_score


def match_creators_for_brief(brief: Brief, creators: List[CreatorProfile]) -> List[Dict[str, Any]]:
    """Legacy helper for Brief model matching."""
    return recommend_top_creators(
        category=brief.content_type or "AI Videos",
        content_type=brief.content_type or "",
        style=brief.style or "",
        tools_suggested=brief.tools_suggested or [],
        budget_max=brief.budget_max or 0.0,
        budget_min=brief.budget_min or 0.0,
        description=brief.description or "",
        creators=creators,
        limit=10,
    )
