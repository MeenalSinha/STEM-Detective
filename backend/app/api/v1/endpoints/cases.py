from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import uuid
from app.db.session import get_db
from app.models.models import User, Case, CaseStatus
from app.schemas.schemas import (
    MysteryGenerateRequest, MysteryOut, DMInteraction, DMResponse,
    HypothesisSubmit, HypothesisResult, HintRequest, HintOut
)
from app.api.deps.auth import get_current_user
from app.services.ai import mystery_ai
from app.services.learning.engine import award_xp, update_knowledge_node, check_achievements, build_learning_profile

router = APIRouter()


@router.post("/generate", response_model=MysteryOut)
async def generate_mystery(
    payload: MysteryGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a new AI mystery."""
    mystery_data = await mystery_ai.generate_mystery(
        subject=payload.subject.value,
        grade_level=payload.grade_level.value,
        difficulty=payload.difficulty.value,
        topic=payload.topic,
        additional_context=payload.additional_context,
    )

    case = Case(
        id=uuid.uuid4(),
        student_id=current_user.id,
        title=mystery_data["title"],
        subject=payload.subject,
        grade_level=payload.grade_level,
        difficulty=payload.difficulty,
        topic=payload.topic,
        story=mystery_data["story"],
        characters=mystery_data.get("characters", []),
        clues=mystery_data.get("clues", []),
        stem_concepts=mystery_data.get("stem_concepts", []),
        investigation_path=mystery_data.get("investigation_path", []),
        solution=mystery_data.get("solution", ""),
        world_state=mystery_data.get("world_state", {}),
        evidence_chain=mystery_data.get("evidence_chain", []),
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Update learning profile
    current_user.learning_profile = build_learning_profile(db, str(current_user.id))
    db.commit()

    return case


@router.get("/", response_model=List[MysteryOut])
def list_cases(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Case).filter(Case.student_id == current_user.id)
    if status:
        q = q.filter(Case.status == status)
    return q.order_by(desc(Case.created_at)).all()


@router.get("/{case_id}", response_model=MysteryOut)
def get_case(
    case_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/interact", response_model=DMResponse)
async def dungeon_master_interact(
    payload: DMInteraction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Interact with the AI Dungeon Master."""
    case = db.query(Case).filter(Case.id == payload.case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_data = {
        "title": case.title,
        "topic": case.topic,
        "subject": case.subject.value if case.subject else "",
        "world_state": case.world_state or {},
        "clues": case.clues or [],
        "stem_concepts": case.stem_concepts or [],
        "progress_percentage": case.progress_percentage,
    }

    response = await mystery_ai.dungeon_master_response(
        case_data=case_data,
        student_message=payload.student_message,
        action_type=payload.action_type,
        conversation_history=case.conversation_history or [],
    )

    # Persist conversation
    history = case.conversation_history or []
    history.append({"role": "user", "content": payload.student_message})
    history.append({"role": "assistant", "content": response.get("narrative", "")})
    case.conversation_history = history[-40:]  # keep last 40 messages

    # Reveal new clues
    if response.get("new_clues"):
        existing_clues = case.clues or []
        new_clue_ids = {c.get("id") for c in response["new_clues"]}
        for clue in existing_clues:
            if clue.get("id") in new_clue_ids:
                clue["is_revealed"] = True
        case.clues = existing_clues

    # Update world state
    if response.get("world_state_changes"):
        world = case.world_state or {}
        world.update(response["world_state_changes"])
        case.world_state = world

    # Update progress
    delta = response.get("investigation_progress_delta", 0)
    case.progress_percentage = min(95, case.progress_percentage + delta)

    # Award XP
    xp = response.get("xp_earned", 0)
    if xp > 0:
        award_xp(db, current_user, xp, "Investigation action")

    db.commit()

    return DMResponse(**response)


@router.post("/{case_id}/hint", response_model=HintOut)
async def get_hint(
    case_id: uuid.UUID,
    payload: HintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    hint_level = min(payload.current_hint_level + 1, 4)
    hint_data = await mystery_ai.generate_hint(
        case_data={"title": case.title, "topic": case.topic, "progress_percentage": case.progress_percentage},
        hint_level=hint_level,
        conversation_history=case.conversation_history or [],
    )

    # Penalize XP for hints
    penalty = hint_level * 10
    if current_user.xp > penalty:
        current_user.xp -= penalty
        db.commit()

    return HintOut(**hint_data)


@router.post("/{case_id}/hypothesis", response_model=HypothesisResult)
async def submit_hypothesis(
    case_id: uuid.UUID,
    payload: HypothesisSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    from app.models.models import Evidence
    evidence_items = db.query(Evidence).filter(
        Evidence.id.in_(payload.supporting_evidence),
        Evidence.case_id == case_id,
    ).all()

    result = await mystery_ai.evaluate_hypothesis(
        hypothesis=payload.hypothesis,
        case_data={
            "title": case.title,
            "solution": case.solution,
            "stem_concepts": case.stem_concepts or [],
        },
        evidence_collected=[{"title": e.title, "description": e.description} for e in evidence_items],
    )

    case.student_hypothesis = payload.hypothesis
    if result.get("is_correct") and result.get("score", 0) >= 0.6:
        case.status = CaseStatus.COMPLETED
        case.is_solved = True
        case.progress_percentage = 100
        from datetime import datetime, timezone
        case.completed_at = datetime.now(timezone.utc)

    xp = result.get("xp_earned", 0)
    if xp > 0:
        award_xp(db, current_user, xp, "Case solved" if case.is_solved else "Hypothesis submitted")

    # Update knowledge nodes
    for concept in result.get("concepts_learned", []):
        update_knowledge_node(db, str(current_user.id), concept, case.subject, result.get("is_correct", False))

    # Check achievements
    solved_count = db.query(Case).filter(Case.student_id == current_user.id, Case.is_solved == True).count()
    achievements = check_achievements(db, current_user, "case_solved", {"total_cases_solved": solved_count})

    db.commit()

    result["achievements_earned"] = achievements
    return HypothesisResult(**result)


@router.delete("/{case_id}")
def abandon_case(
    case_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = CaseStatus.ABANDONED
    db.commit()
    return {"message": "Case abandoned"}


@router.post("/{case_id}/stream-dm")
async def stream_dungeon_master(
    case_id: uuid.UUID,
    payload: DMInteraction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream dungeon master response for real-time typing effect."""
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_data = {
        "title": case.title,
        "topic": case.topic,
        "subject": case.subject.value if case.subject else "",
        "world_state": case.world_state or {},
        "clues": case.clues or [],
        "stem_concepts": case.stem_concepts or [],
        "progress_percentage": case.progress_percentage,
    }

    async def event_generator():
        try:
            async for chunk in mystery_ai.stream_dungeon_master(
                case_data=case_data,
                student_message=payload.student_message,
                action_type=payload.action_type or "investigate",
                conversation_history=case.conversation_history or [],
            ):
                yield f"data: {chunk}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

