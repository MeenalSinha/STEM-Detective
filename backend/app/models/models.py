from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
import uuid
import enum
from app.db.session import Base

try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False


class GradeLevel(str, enum.Enum):
    ELEMENTARY = "elementary"
    MIDDLE = "middle"
    HIGH = "high"
    COLLEGE = "college"


class Subject(str, enum.Enum):
    BIOLOGY = "biology"
    CHEMISTRY = "chemistry"
    PHYSICS = "physics"
    MATHEMATICS = "mathematics"
    ENGINEERING = "engineering"
    ENVIRONMENTAL = "environmental"
    COMPUTER_SCIENCE = "computer_science"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class CaseStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar_url = Column(String)
    grade_level = Column(SAEnum(GradeLevel), default=GradeLevel.MIDDLE)
    role = Column(String, default="student")  # student | teacher | admin
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    detective_rank = Column(String, default="Rookie Detective")
    learning_profile = Column(JSON, default=dict)
    preferences = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cases = relationship("Case", back_populates="student")
    achievements = relationship("UserAchievement", back_populates="user")
    classroom_members = relationship("ClassroomMember", back_populates="user")


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    subject = Column(SAEnum(Subject), nullable=False)
    grade_level = Column(SAEnum(GradeLevel), nullable=False)
    difficulty = Column(SAEnum(Difficulty), nullable=False)
    topic = Column(String, nullable=False)
    status = Column(SAEnum(CaseStatus), default=CaseStatus.ACTIVE)
    story = Column(Text)
    characters = Column(JSON, default=list)
    clues = Column(JSON, default=list)
    evidence_chain = Column(JSON, default=list)
    stem_concepts = Column(JSON, default=list)
    investigation_path = Column(JSON, default=list)
    world_state = Column(JSON, default=dict)
    conversation_history = Column(JSON, default=list)
    progress_percentage = Column(Float, default=0.0)
    xp_earned = Column(Integer, default=0)
    solution = Column(Text)
    student_hypothesis = Column(Text)
    is_solved = Column(Boolean, default=False)
    thumbnail_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    student = relationship("User", back_populates="cases")
    evidence_items = relationship("Evidence", back_populates="case")
    lab_experiments = relationship("LabExperiment", back_populates="case")
    hints_used = relationship("HintUsage", back_populates="case")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    evidence_type = Column(String)  # photo, data, witness, lab_result, clue
    content = Column(JSON)
    image_url = Column(String)
    is_key_evidence = Column(Boolean, default=False)
    relevance_score = Column(Float, default=0.0)
    ai_analysis = Column(Text)
    collected_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="evidence_items")

    if HAS_PGVECTOR:
        embedding = Column(Vector(1536))


class LabExperiment(Base):
    __tablename__ = "lab_experiments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    lab_type = Column(String)  # chemistry, biology, physics, environmental
    experiment_name = Column(String)
    hypothesis = Column(Text)
    procedure = Column(JSON)
    variables = Column(JSON)
    results = Column(JSON)
    conclusion = Column(Text)
    is_correct = Column(Boolean)
    xp_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="lab_experiments")


class HintUsage(Base):
    __tablename__ = "hint_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    hint_level = Column(Integer)
    hint_text = Column(Text)
    used_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="hints_used")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    icon = Column(String)
    badge_type = Column(String)  # bronze, silver, gold, platinum
    xp_reward = Column(Integer, default=0)
    criteria = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")


class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    concept = Column(String, nullable=False)
    subject = Column(SAEnum(Subject))
    mastery_level = Column(Float, default=0.0)  # 0.0 - 1.0
    times_encountered = Column(Integer, default=0)
    times_correct = Column(Integer, default=0)
    last_seen = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    join_code = Column(String, unique=True)
    grade_level = Column(SAEnum(GradeLevel))
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("ClassroomMember", back_populates="classroom")
    assignments = relationship("Assignment", back_populates="classroom")


class ClassroomMember(Base):
    __tablename__ = "classroom_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    classroom = relationship("Classroom", back_populates="members")
    user = relationship("User", back_populates="classroom_members")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    title = Column(String, nullable=False)
    mystery_config = Column(JSON)  # subject, topic, difficulty, grade_level
    due_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    classroom = relationship("Classroom", back_populates="assignments")


class STEMConcept(Base):
    """Vector-searchable STEM knowledge base"""
    __tablename__ = "stem_concepts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    concept = Column(String, nullable=False)
    subject = Column(SAEnum(Subject))
    grade_level = Column(SAEnum(GradeLevel))
    explanation = Column(Text)
    examples = Column(JSON)
    related_concepts = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    if HAS_PGVECTOR:
        embedding = Column(Vector(1536))
