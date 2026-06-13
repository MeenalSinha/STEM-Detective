from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.models import GradeLevel, Subject, Difficulty, CaseStatus


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    grade_level: GradeLevel = GradeLevel.MIDDLE
    role: str = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    grade_level: GradeLevel
    role: str
    xp: int
    level: int
    detective_rank: str
    learning_profile: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Mystery Generation ────────────────────────────────────────────────────────

class MysteryGenerateRequest(BaseModel):
    subject: Subject
    grade_level: GradeLevel
    difficulty: Difficulty
    topic: str
    additional_context: Optional[str] = None


class Character(BaseModel):
    name: str
    role: str
    description: str
    dialogue_style: str
    knowledge: List[str]


class Clue(BaseModel):
    id: str
    title: str
    description: str
    clue_type: str
    stem_concept: str
    is_revealed: bool = False
    unlock_condition: Optional[str] = None


class MysteryOut(BaseModel):
    id: UUID
    title: str
    subject: Subject
    grade_level: GradeLevel
    difficulty: Difficulty
    topic: str
    story: str
    characters: List[Dict[str, Any]]
    clues: List[Dict[str, Any]]
    stem_concepts: List[str]
    investigation_path: List[str]
    progress_percentage: float
    status: CaseStatus
    world_state: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dungeon Master ────────────────────────────────────────────────────────────

class DMInteraction(BaseModel):
    case_id: UUID
    student_message: str
    action_type: str = "investigate"  # investigate, question, analyze, hypothesis


class DMResponse(BaseModel):
    narrative: str
    new_clues: List[Dict[str, Any]]
    world_state_changes: Dict[str, Any]
    stem_challenge: Optional[Dict[str, Any]]
    xp_earned: int
    is_plot_twist: bool


# ── Evidence ──────────────────────────────────────────────────────────────────

class EvidenceCreate(BaseModel):
    case_id: UUID
    title: str
    description: str
    evidence_type: str
    content: Optional[Dict[str, Any]] = None


class EvidenceAnalysisRequest(BaseModel):
    case_id: UUID
    evidence_id: UUID
    student_interpretation: Optional[str] = None


class EvidenceOut(BaseModel):
    id: UUID
    title: str
    description: str
    evidence_type: str
    content: Optional[Dict[str, Any]]
    relevance_score: float
    ai_analysis: Optional[str]
    is_key_evidence: bool
    collected_at: datetime

    class Config:
        from_attributes = True


# ── Lab ───────────────────────────────────────────────────────────────────────

class LabExperimentRequest(BaseModel):
    case_id: UUID
    lab_type: str
    hypothesis: str
    parameters: Dict[str, Any]


class LabResultOut(BaseModel):
    experiment_id: UUID
    results: Dict[str, Any]
    conclusion: str
    is_correct: bool
    feedback: str
    stem_concepts_reinforced: List[str]
    xp_earned: int


# ── Hints ─────────────────────────────────────────────────────────────────────

class HintRequest(BaseModel):
    case_id: UUID
    current_hint_level: int = 0


class HintOut(BaseModel):
    hint_text: str
    hint_level: int
    xp_penalty: int


# ── Hypothesis ────────────────────────────────────────────────────────────────

class HypothesisSubmit(BaseModel):
    case_id: UUID
    hypothesis: str
    supporting_evidence: List[UUID]


class HypothesisResult(BaseModel):
    is_correct: bool
    score: float
    feedback: str
    solution_explanation: str
    concepts_learned: List[str]
    xp_earned: int
    achievements_earned: List[Dict[str, Any]]


# ── Knowledge Graph ───────────────────────────────────────────────────────────

class KnowledgeGraphOut(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    mastery_summary: Dict[str, float]


# ── Leaderboard ───────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    username: str
    avatar_url: Optional[str]
    detective_rank: str
    xp: int
    cases_solved: int
    level: int


# ── Teacher ───────────────────────────────────────────────────────────────────

class ClassroomCreate(BaseModel):
    name: str
    description: Optional[str] = None
    grade_level: GradeLevel


class AssignmentCreate(BaseModel):
    classroom_id: UUID
    title: str
    subject: Subject
    topic: str
    difficulty: Difficulty
    due_date: Optional[datetime] = None


class MysteryStudioRequest(BaseModel):
    topic: str
    subject: Subject
    grade_level: GradeLevel
    difficulty: Difficulty
    learning_objectives: Optional[List[str]] = None
    duration_minutes: Optional[int] = 45
