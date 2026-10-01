from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List
import uuid
from app.db.session import get_db
from app.models.models import User, Case, Evidence, KnowledgeNode, Achievement, UserAchievement, Classroom, ClassroomMember, Assignment
from app.schemas.schemas import EvidenceCreate, EvidenceOut, EvidenceAnalysisRequest, KnowledgeGraphOut, LeaderboardEntry, ClassroomCreate, AssignmentCreate, MysteryStudioRequest
from app.api.deps.auth import get_current_user, require_teacher
from app.services.ai.mystery_ai import analyze_evidence as ai_analyze_evidence, generate_mystery_studio
from app.services.learning.engine import get_knowledge_graph, build_learning_profile

# Evidence Router
evidence_router = APIRouter()

@evidence_router.post("/", response_model=EvidenceOut)
async def add_evidence(
    payload: EvidenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == payload.case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_context = f"Mystery: {case.title}. Topic: {case.topic}"
    analysis = await ai_analyze_evidence(
        evidence_description=f"{payload.title}: {payload.description}",
        case_context=case_context,
        student_interpretation=payload.description,
    )

    evidence = Evidence(
        id=uuid.uuid4(),
        case_id=payload.case_id,
        title=payload.title,
        description=payload.description,
        evidence_type=payload.evidence_type,
        content=payload.content,
        relevance_score=analysis.get("relevance_score", 0.5),
        ai_analysis=analysis.get("analysis", ""),
        is_key_evidence=analysis.get("is_key_evidence", False),
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


@evidence_router.get("/case/{case_id}", response_model=List[EvidenceOut])
def get_case_evidence(
    case_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db.query(Evidence).filter(Evidence.case_id == case_id).all()


@evidence_router.post("/{evidence_id}/analyze")
async def analyze_evidence_item(
    evidence_id: uuid.UUID,
    payload: EvidenceAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    case = db.query(Case).filter(Case.id == evidence.case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=403, detail="Access denied")

    analysis = await ai_analyze_evidence(
        evidence_description=f"{evidence.title}: {evidence.description}",
        case_context=f"Mystery: {case.title}. Topic: {case.topic}",
        student_interpretation=payload.student_interpretation,
    )

    evidence.ai_analysis = analysis.get("analysis", "")
    evidence.relevance_score = analysis.get("relevance_score", evidence.relevance_score)
    db.commit()

    return {"analysis": analysis, "detective_feedback": analysis.get("detective_feedback", "")}


# User/Stats Router
user_router = APIRouter()

@user_router.get("/stats")
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cases = db.query(Case).filter(Case.student_id == current_user.id).all()
    solved = [c for c in cases if c.is_solved]

    achievements = db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id).count()

    return {
        "xp": current_user.xp,
        "level": current_user.level,
        "detective_rank": current_user.detective_rank,
        "total_cases": len(cases),
        "cases_solved": len(solved),
        "active_cases": sum(1 for c in cases if c.status == "active"),
        "achievements_count": achievements,
        "learning_profile": build_learning_profile(db, str(current_user.id)),
    }


@user_router.get("/knowledge-graph", response_model=KnowledgeGraphOut)
def get_my_knowledge_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    graph = get_knowledge_graph(db, str(current_user.id))
    return graph


@user_router.get("/achievements")
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_achievements = (
        db.query(UserAchievement, Achievement)
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .filter(UserAchievement.user_id == current_user.id)
        .all()
    )
    all_achievements = db.query(Achievement).all()

    earned_ids = {str(ua.achievement_id) for ua, _ in user_achievements}

    return {
        "earned": [
            {
                "id": str(a.id),
                "name": a.name,
                "description": a.description,
                "badge_type": a.badge_type,
                "xp_reward": a.xp_reward,
                "earned_at": ua.earned_at,
            }
            for ua, a in user_achievements
        ],
        "available": [
            {
                "id": str(a.id),
                "name": a.name,
                "description": a.description,
                "badge_type": a.badge_type,
                "xp_reward": a.xp_reward,
                "earned": str(a.id) in earned_ids,
            }
            for a in all_achievements
        ],
    }


# Leaderboard Router
leaderboard_router = APIRouter()

@leaderboard_router.get("/", response_model=List[LeaderboardEntry])
def get_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.is_active == True).order_by(desc(User.xp)).limit(limit).all()

    result = []
    for rank, user in enumerate(users, 1):
        cases_solved = db.query(Case).filter(
            Case.student_id == user.id,
            Case.is_solved == True
        ).count()
        result.append(LeaderboardEntry(
            rank=rank,
            user_id=user.id,
            username=user.username,
            avatar_url=user.avatar_url,
            detective_rank=user.detective_rank,
            xp=user.xp,
            cases_solved=cases_solved,
            level=user.level,
        ))
    return result


# Teacher Router
teacher_router = APIRouter()

@teacher_router.post("/classrooms")
def create_classroom(
    payload: ClassroomCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    import random, string
    join_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    classroom = Classroom(
        id=uuid.uuid4(),
        teacher_id=current_user.id,
        name=payload.name,
        description=payload.description,
        grade_level=payload.grade_level,
        join_code=join_code,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return {"id": str(classroom.id), "name": classroom.name, "join_code": classroom.join_code}


@teacher_router.get("/classrooms")
def get_classrooms(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classrooms = db.query(Classroom).filter(Classroom.teacher_id == current_user.id).all()
    result = []
    for c in classrooms:
        member_count = db.query(ClassroomMember).filter(ClassroomMember.classroom_id == c.id).count()
        result.append({
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "join_code": c.join_code,
            "grade_level": c.grade_level.value if c.grade_level else None,
            "member_count": member_count,
            "created_at": c.created_at,
        })
    return result


@teacher_router.post("/mystery-studio")
async def mystery_studio(
    payload: MysteryStudioRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    result = await generate_mystery_studio(
        topic=payload.topic,
        subject=payload.subject.value,
        grade_level=payload.grade_level.value,
        difficulty=payload.difficulty.value,
        learning_objectives=payload.learning_objectives or [],
        duration_minutes=payload.duration_minutes or 45,
    )
    return result


@teacher_router.get("/classrooms/{classroom_id}/students")
def get_classroom_students(
    classroom_id: uuid.UUID,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(
        Classroom.id == classroom_id,
        Classroom.teacher_id == current_user.id
    ).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    members = (
        db.query(ClassroomMember, User)
        .join(User, ClassroomMember.user_id == User.id)
        .filter(ClassroomMember.classroom_id == classroom_id)
        .all()
    )

    result = []
    for member, user in members:
        cases_solved = db.query(Case).filter(Case.student_id == user.id, Case.is_solved == True).count()
        result.append({
            "user_id": str(user.id),
            "username": user.username,
            "full_name": user.full_name,
            "xp": user.xp,
            "level": user.level,
            "detective_rank": user.detective_rank,
            "cases_solved": cases_solved,
            "joined_at": member.joined_at,
        })
    return result


# Classroom join endpoint (student)
@user_router.post("/join-classroom")
def join_classroom(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    join_code = payload.get("join_code", "").upper()
    classroom = db.query(Classroom).filter(Classroom.join_code == join_code, Classroom.is_active == True).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Invalid join code")

    existing = db.query(ClassroomMember).filter(
        ClassroomMember.classroom_id == classroom.id,
        ClassroomMember.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    member = ClassroomMember(
        id=uuid.uuid4(),
        classroom_id=classroom.id,
        user_id=current_user.id,
    )
    db.add(member)
    db.commit()
    return {"message": f"Joined classroom: {classroom.name}"}
