"""Multiplayer/Collaborative investigation endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
from app.db.session import get_db
from app.models.models import User, Case, Classroom, ClassroomMember, Evidence
from app.api.deps.auth import get_current_user

router = APIRouter()


@router.get("/session/{case_id}")
def get_multiplayer_session(
    case_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get collaborative session state for a case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Get all evidence for this case (shared board)
    evidence = db.query(Evidence).filter(Evidence.case_id == case_id).all()

    # Find teammates (classmates of the case owner)
    owner_memberships = db.query(ClassroomMember).filter(
        ClassroomMember.user_id == case.student_id
    ).all()

    teammates = []
    for membership in owner_memberships:
        members = db.query(ClassroomMember, User).join(
            User, ClassroomMember.user_id == User.id
        ).filter(
            ClassroomMember.classroom_id == membership.classroom_id,
            ClassroomMember.user_id != current_user.id
        ).limit(5).all()

        for _, member_user in members:
            if not any(t["user_id"] == str(member_user.id) for t in teammates):
                teammates.append({
                    "user_id": str(member_user.id),
                    "username": member_user.username,
                    "detective_rank": member_user.detective_rank,
                    "level": member_user.level,
                    "is_online": True,  # Simplified — real implementation uses WebSockets
                })

    return {
        "case_id": str(case_id),
        "case_title": case.title,
        "case_subject": case.subject.value if case.subject else None,
        "owner_id": str(case.student_id),
        "shared_evidence": [
            {
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "evidence_type": e.evidence_type,
                "is_key_evidence": e.is_key_evidence,
                "relevance_score": e.relevance_score,
                "collected_at": e.collected_at,
            }
            for e in evidence
        ],
        "teammates": teammates,
        "team_hypothesis": case.student_hypothesis or "",
        "progress": case.progress_percentage,
    }


@router.post("/session/{case_id}/hypothesis")
def update_team_hypothesis(
    case_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update team's shared hypothesis."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    hypothesis = payload.get("hypothesis", "")
    case.student_hypothesis = hypothesis
    db.commit()
    return {"status": "updated", "hypothesis": hypothesis}


@router.post("/session/{case_id}/message")
def post_team_message(
    case_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Post a message to team chat (stored in case conversation history)."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history = case.conversation_history or []
    history.append({
        "role": "team_chat",
        "user_id": str(current_user.id),
        "username": current_user.username,
        "content": message,
        "timestamp": datetime.utcnow().isoformat(),
    })
    case.conversation_history = history
    db.commit()

    return {
        "status": "sent",
        "message": {
            "user_id": str(current_user.id),
            "username": current_user.username,
            "content": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
    }


@router.get("/session/{case_id}/messages")
def get_team_messages(
    case_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get team chat messages for this case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    history = case.conversation_history or []
    messages = [m for m in history if m.get("role") == "team_chat"]
    return messages


@router.get("/lobby")
def get_multiplayer_lobby(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get available collaborative cases (active cases by classroom members)."""
    # Find classrooms user is in
    memberships = db.query(ClassroomMember).filter(
        ClassroomMember.user_id == current_user.id
    ).all()

    classroom_ids = [m.classroom_id for m in memberships]

    if not classroom_ids:
        return {"sessions": [], "classmates": []}

    # Find classmates
    classmates_q = db.query(ClassroomMember, User).join(
        User, ClassroomMember.user_id == User.id
    ).filter(
        ClassroomMember.classroom_id.in_(classroom_ids),
        ClassroomMember.user_id != current_user.id,
    ).limit(20).all()

    classmates = [
        {
            "user_id": str(u.id),
            "username": u.username,
            "detective_rank": u.detective_rank,
            "level": u.level,
            "xp": u.xp,
        }
        for _, u in classmates_q
    ]

    # Find active cases from classmates
    classmate_ids = [c["user_id"] for c in classmates]
    active_cases = db.query(Case).filter(
        Case.student_id.in_([uuid.UUID(cid) for cid in classmate_ids]),
        Case.status == "active",
    ).limit(10).all() if classmate_ids else []

    sessions = [
        {
            "case_id": str(c.id),
            "case_title": c.title,
            "subject": c.subject.value if c.subject else None,
            "difficulty": c.difficulty.value if c.difficulty else None,
            "progress": c.progress_percentage,
            "owner_id": str(c.student_id),
        }
        for c in active_cases
    ]

    return {"sessions": sessions, "classmates": classmates}
