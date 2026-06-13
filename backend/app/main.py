from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, Base

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting STEM Detective API", environment=settings.ENVIRONMENT)
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed achievements
    await seed_achievements()
    yield
    logger.info("Shutting down STEM Detective API")


async def seed_achievements():
    """Seed default achievements if they don't exist."""
    from app.db.session import SessionLocal
    from app.models.models import Achievement
    import uuid

    achievements = [
        {"name": "First Case", "description": "Solve your very first mystery", "badge_type": "bronze", "xp_reward": 50, "criteria": {"type": "first_case"}},
        {"name": "Triple Threat", "description": "Solve 3 mysteries", "badge_type": "bronze", "xp_reward": 100, "criteria": {"type": "cases_solved", "count": 3}},
        {"name": "STEM Sleuth", "description": "Solve 10 mysteries", "badge_type": "silver", "xp_reward": 250, "criteria": {"type": "cases_solved", "count": 10}},
        {"name": "Master Detective", "description": "Solve 25 mysteries", "badge_type": "gold", "xp_reward": 500, "criteria": {"type": "cases_solved", "count": 25}},
        {"name": "XP Milestone: 1000", "description": "Earn 1,000 XP", "badge_type": "bronze", "xp_reward": 0, "criteria": {"type": "xp", "amount": 1000}},
        {"name": "XP Milestone: 5000", "description": "Earn 5,000 XP", "badge_type": "silver", "xp_reward": 0, "criteria": {"type": "xp", "amount": 5000}},
        {"name": "Science Pioneer", "description": "Complete experiments in all 4 lab types", "badge_type": "gold", "xp_reward": 300, "criteria": {"type": "all_labs"}},
    ]

    db = SessionLocal()
    try:
        for ach_data in achievements:
            existing = db.query(Achievement).filter(Achievement.name == ach_data["name"]).first()
            if not existing:
                db.add(Achievement(id=uuid.uuid4(), **ach_data))
        db.commit()
    except Exception as e:
        logger.error("Failed to seed achievements", error=str(e))
    finally:
        db.close()


app = FastAPI(
    title="STEM Detective API",
    description="AI-powered STEM mystery education platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "stem-detective-api", "version": "1.0.0"}
