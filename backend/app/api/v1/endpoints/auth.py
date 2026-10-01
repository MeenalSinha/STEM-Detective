from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps.auth import get_current_user
import uuid

router = APIRouter()


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        grade_level=payload.grade_level,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me/profile")
def update_profile(
    updates: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {"full_name", "avatar_url", "grade_level", "preferences", "learning_profile", "username"}
    new_username = updates.get("username")
    if new_username and new_username != current_user.username:
        if not isinstance(new_username, str) or not (3 <= len(new_username) <= 30):
            raise HTTPException(status_code=422, detail="Username must be 3-30 characters")
        if db.query(User).filter(User.username == new_username, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Username already taken")
    for key, value in updates.items():
        if key in allowed:
            if key == "grade_level" and isinstance(value, str):
                from app.models.models import GradeLevel
                try:
                    value = GradeLevel(value)
                except ValueError:
                    continue
            setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)



@router.delete("/me", status_code=204)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the signed-in account and all of its game data.

    Required by App Store guideline 5.1.1(v) for apps that create accounts.
    Does not cancel store subscriptions: those are managed in the App Store / Google Play.
    """
    from app.models.models import (
        Case, Evidence, HintUsage, LabExperiment, KnowledgeNode, UserAchievement,
        Entitlement, ClassroomMember, Classroom, Assignment,
    )
    uid = current_user.id
    case_ids = [c.id for c in db.query(Case.id).filter(Case.student_id == uid).all()]
    if case_ids:
        for model in (Evidence, HintUsage, LabExperiment):
            db.query(model).filter(model.case_id.in_(case_ids)).delete(synchronize_session=False)
    db.query(Case).filter(Case.student_id == uid).delete(synchronize_session=False)
    for model in (KnowledgeNode, UserAchievement, Entitlement, ClassroomMember):
        db.query(model).filter(model.user_id == uid).delete(synchronize_session=False)
    owned = [c.id for c in db.query(Classroom.id).filter(Classroom.teacher_id == uid).all()]
    if owned:
        db.query(Assignment).filter(Assignment.classroom_id.in_(owned)).delete(synchronize_session=False)
        db.query(ClassroomMember).filter(ClassroomMember.classroom_id.in_(owned)).delete(synchronize_session=False)
        db.query(Classroom).filter(Classroom.id.in_(owned)).delete(synchronize_session=False)
    db.query(User).filter(User.id == uid).delete(synchronize_session=False)
    db.commit()
    return None
