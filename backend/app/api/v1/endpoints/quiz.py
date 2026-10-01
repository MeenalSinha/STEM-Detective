from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.db.session import get_db
from app.models.models import User, Case
from app.api.deps.auth import get_current_user
from app.services.ai.learning_science import (
    generate_proof_of_learning_quiz,
    evaluate_quiz_response,
    detect_misconception,
    generate_world_decay_event,
)
from app.services.learning.engine import award_xp, update_knowledge_node, build_learning_profile

router = APIRouter()


class QuizRequest(BaseModel):
    case_id: uuid.UUID


class QuizAnswerRequest(BaseModel):
    case_id: uuid.UUID
    answers: List[dict]  # [{"question_id": "q1", "answer": "b"}, ...]


class MisconceptionCheckRequest(BaseModel):
    case_id: uuid.UUID
    student_text: str


class WorldDecayRequest(BaseModel):
    case_id: uuid.UUID
    actions_since_last_event: int = 0


@router.post("/generate")
async def generate_quiz(
    payload: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate proof-of-learning quiz after a case is solved.
    This is the most educationally valuable endpoint — proves real learning happened.
    """
    case = db.query(Case).filter(
        Case.id == payload.case_id,
        Case.student_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Get student learning profile for adaptive targeting
    learning_profile = build_learning_profile(db, str(current_user.id))

    case_data = {
        "title": case.title,
        "topic": case.topic,
        "subject": case.subject.value if case.subject else "biology",
        "stem_concepts": case.stem_concepts or [],
        "solution": case.solution or "",
        "progress_percentage": case.progress_percentage,
    }

    quiz = await generate_proof_of_learning_quiz(
        case_data=case_data,
        student_performance=learning_profile,
    )

    return {
        "quiz": quiz,
        "case_title": case.title,
        "subject": case.subject.value if case.subject else "biology",
        "message": "Prove what you learned. No XP lost for wrong answers — this is just for you.",
    }


@router.post("/submit")
async def submit_quiz(
    payload: QuizAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit quiz answers and get personalized feedback.
    Updates knowledge graph with retention scores.
    """
    case = db.query(Case).filter(
        Case.id == payload.case_id,
        Case.student_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    results = []
    total_xp = 0
    correct_count = 0

    for answer_data in payload.answers:
        question_id = answer_data.get("question_id")
        student_answer = answer_data.get("answer", "")
        question_data = answer_data.get("question_data", {})

        result = await evaluate_quiz_response(
            question=question_data,
            student_answer=student_answer,
            case_context=f"{case.title} - {case.topic}",
        )

        results.append(result)
        total_xp += result.get("xp_earned", 0)
        if result.get("is_correct"):
            correct_count += 1

        # Update knowledge graph for the specific concept tested
        concept = question_data.get("stem_concept", case.topic)
        if concept:
            update_knowledge_node(
                db=db,
                user_id=str(current_user.id),
                concept=concept,
                subject=case.subject,
                is_correct=result.get("is_correct", False),
            )

    # Award XP for quiz completion
    if total_xp > 0:
        award_xp(db, current_user, total_xp, f"Proof-of-Learning Quiz: {case.title}")

    retention_score = round((correct_count / max(len(results), 1)) * 100)

    return {
        "results": results,
        "correct_count": correct_count,
        "total_questions": len(results),
        "retention_score": retention_score,
        "xp_awarded": total_xp,
        "retention_label": (
            "Excellent retention" if retention_score >= 80
            else "Good understanding" if retention_score >= 60
            else "Review recommended"
        ),
        "message": (
            f"You retained {retention_score}% of what you learned. "
            + ("Outstanding detective work!" if retention_score >= 80 else
               "Keep investigating to deepen your understanding.")
        ),
    }


@router.post("/check-misconception")
async def check_misconception(
    payload: MisconceptionCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Real-time misconception interceptor.
    Call during DM investigation to catch scientific errors before they solidify.
    """
    case = db.query(Case).filter(
        Case.id == payload.case_id,
        Case.student_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    subject = case.subject.value if case.subject else "biology"
    result = await detect_misconception(
        student_text=payload.student_text,
        subject=subject,
        case_context=f"{case.title} - {case.topic}",
    )

    return {
        "has_misconception": result is not None,
        "misconception_data": result,
    }


@router.post("/world-decay")
async def trigger_world_decay(
    payload: WorldDecayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Dynamic world simulation — escalate consequences.
    Creates urgency and teaches cause-and-effect.
    """
    case = db.query(Case).filter(
        Case.id == payload.case_id,
        Case.student_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_data = {
        "title": case.title,
        "topic": case.topic,
        "world_state": case.world_state or {},
    }

    event = await generate_world_decay_event(
        world_state=case.world_state or {},
        case_data=case_data,
        actions_since_last_event=payload.actions_since_last_event,
    )

    if event:
        # Update case world state
        world = case.world_state or {}
        world.update(event.get("world_state_updates", {}))
        world["severity"] = event.get("new_severity", world.get("severity", "low"))
        case.world_state = world

        # Add any new evidence that appeared
        new_evidence = event.get("new_evidence_revealed")
        if new_evidence:
            clues = case.clues or []
            new_clue = {
                "id": f"decay_clue_{len(clues)}",
                "title": new_evidence.get("title", "New Evidence"),
                "description": new_evidence.get("description", ""),
                "clue_type": "physical",
                "stem_concept": new_evidence.get("stem_concept", ""),
                "is_revealed": True,
            }
            clues.append(new_clue)
            case.clues = clues

        db.commit()

    return {
        "event": event,
        "triggered": event is not None,
    }
