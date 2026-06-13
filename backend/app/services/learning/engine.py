"""Personalized learning engine: tracks student performance and adapts future mysteries."""
from typing import Any
from sqlalchemy.orm import Session
from app.models.models import User, Case, KnowledgeNode, Subject, GradeLevel
from sqlalchemy import func


XP_THRESHOLDS = [
    0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200,
    6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 30000, 36000
]

DETECTIVE_RANKS = [
    "Rookie Detective", "Junior Detective", "Detective", "Senior Detective",
    "Lead Investigator", "Chief Investigator", "Expert Analyst", "Master Detective",
    "Elite Forensics", "Grand Master Detective", "Legendary Investigator",
]


def calculate_level(xp: int) -> tuple[int, str]:
    """Return (level, rank) for given XP."""
    level = 1
    for i, threshold in enumerate(XP_THRESHOLDS):
        if xp >= threshold:
            level = i + 1
    level = min(level, len(DETECTIVE_RANKS))
    rank = DETECTIVE_RANKS[min(level - 1, len(DETECTIVE_RANKS) - 1)]
    return level, rank


def xp_for_next_level(xp: int) -> int:
    """Return XP needed for next level."""
    level, _ = calculate_level(xp)
    if level >= len(XP_THRESHOLDS):
        return 0
    return XP_THRESHOLDS[level] - xp


def award_xp(db: Session, user: User, amount: int, reason: str) -> dict:
    """Award XP to user and check for level up."""
    old_level, _ = calculate_level(user.xp)
    user.xp += amount
    new_level, new_rank = calculate_level(user.xp)
    user.level = new_level
    user.detective_rank = new_rank
    db.commit()
    db.refresh(user)

    return {
        "xp_awarded": amount,
        "total_xp": user.xp,
        "level": new_level,
        "detective_rank": new_rank,
        "leveled_up": new_level > old_level,
        "reason": reason,
    }


def update_knowledge_node(
    db: Session,
    user_id: str,
    concept: str,
    subject: Subject,
    is_correct: bool,
) -> KnowledgeNode:
    """Update or create a knowledge node for the user."""
    node = db.query(KnowledgeNode).filter(
        KnowledgeNode.user_id == user_id,
        KnowledgeNode.concept == concept,
    ).first()

    if not node:
        node = KnowledgeNode(
            user_id=user_id,
            concept=concept,
            subject=subject,
            mastery_level=0.0,
            times_encountered=0,
            times_correct=0,
        )
        db.add(node)

    node.times_encountered += 1
    if is_correct:
        node.times_correct += 1

    # Mastery = weighted average (recent performance weighted more)
    accuracy = node.times_correct / node.times_encountered
    recency_weight = min(node.times_encountered / 10, 1.0)
    node.mastery_level = round(accuracy * recency_weight, 2)

    db.commit()
    db.refresh(node)
    return node


def get_knowledge_graph(db: Session, user_id: str) -> dict:
    """Build knowledge graph data for visualization."""
    nodes_data = db.query(KnowledgeNode).filter(
        KnowledgeNode.user_id == user_id
    ).all()

    # Build nodes
    nodes = []
    for n in nodes_data:
        nodes.append({
            "id": str(n.id),
            "concept": n.concept,
            "subject": n.subject.value if n.subject else "general",
            "mastery_level": n.mastery_level,
            "times_encountered": n.times_encountered,
            "status": (
                "mastered" if n.mastery_level >= 0.8
                else "learning" if n.mastery_level >= 0.4
                else "weak"
            ),
        })

    # Build edges (connect related concepts by subject)
    edges = []
    subject_nodes: dict[str, list] = {}
    for n in nodes:
        s = n["subject"]
        subject_nodes.setdefault(s, []).append(n["id"])

    edge_id = 0
    for subject, node_ids in subject_nodes.items():
        for i in range(len(node_ids)):
            for j in range(i + 1, min(i + 3, len(node_ids))):
                edges.append({
                    "id": f"e{edge_id}",
                    "source": node_ids[i],
                    "target": node_ids[j],
                    "subject": subject,
                })
                edge_id += 1

    mastery_by_subject: dict[str, float] = {}
    for n in nodes_data:
        if n.subject:
            s = n.subject.value
            existing = mastery_by_subject.get(s, [])
            if isinstance(existing, list):
                existing.append(n.mastery_level)
                mastery_by_subject[s] = existing

    mastery_summary = {
        s: round(sum(v) / len(v), 2) if v else 0.0
        for s, v in mastery_by_subject.items()
    }

    return {
        "nodes": nodes,
        "edges": edges,
        "mastery_summary": mastery_summary,
        "total_concepts": len(nodes),
        "mastered_count": sum(1 for n in nodes if n["status"] == "mastered"),
    }


def build_learning_profile(db: Session, user_id: str) -> dict:
    """Analyze student performance to build adaptive learning profile."""
    cases = db.query(Case).filter(Case.student_id == user_id).all()

    if not cases:
        return {"experience_level": "new", "strengths": [], "weaknesses": []}

    solved = [c for c in cases if c.is_solved]
    solve_rate = len(solved) / len(cases) if cases else 0

    # Subject performance
    subject_performance: dict[str, list] = {}
    for case in cases:
        s = case.subject.value if case.subject else "unknown"
        subject_performance.setdefault(s, []).append(
            case.progress_percentage / 100
        )

    subject_avg = {
        s: round(sum(v) / len(v), 2)
        for s, v in subject_performance.items()
    }

    strengths = [s for s, avg in subject_avg.items() if avg >= 0.7]
    weaknesses = [s for s, avg in subject_avg.items() if avg < 0.5]

    avg_progress = sum(c.progress_percentage for c in cases) / len(cases) if cases else 0

    return {
        "experience_level": (
            "expert" if solve_rate > 0.8
            else "advanced" if solve_rate > 0.6
            else "intermediate" if solve_rate > 0.3
            else "beginner"
        ),
        "solve_rate": round(solve_rate, 2),
        "total_cases": len(cases),
        "cases_solved": len(solved),
        "average_progress": round(avg_progress, 1),
        "subject_performance": subject_avg,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommended_subjects": weaknesses[:2],
        "recommended_difficulty": (
            "hard" if solve_rate > 0.7
            else "medium" if solve_rate > 0.4
            else "easy"
        ),
    }


def check_achievements(db: Session, user: User, event: str, data: dict) -> list[dict]:
    """Check and award achievements based on events."""
    from app.models.models import Achievement, UserAchievement

    earned = []
    all_achievements = db.query(Achievement).all()
    user_achievement_ids = {
        str(ua.achievement_id)
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }

    for achievement in all_achievements:
        if str(achievement.id) in user_achievement_ids:
            continue

        criteria = achievement.criteria or {}
        unlocked = False

        if event == "case_solved":
            cases_solved = data.get("total_cases_solved", 0)
            if criteria.get("type") == "cases_solved" and cases_solved >= criteria.get("count", 999):
                unlocked = True

        elif event == "xp_milestone":
            if criteria.get("type") == "xp" and user.xp >= criteria.get("amount", 999999):
                unlocked = True

        elif event == "first_case":
            if criteria.get("type") == "first_case":
                unlocked = True

        if unlocked:
            ua = UserAchievement(user_id=user.id, achievement_id=achievement.id)
            db.add(ua)
            award_xp(db, user, achievement.xp_reward, f"Achievement: {achievement.name}")
            earned.append({
                "name": achievement.name,
                "description": achievement.description,
                "badge_type": achievement.badge_type,
                "xp_reward": achievement.xp_reward,
            })

    if earned:
        db.commit()

    return earned
