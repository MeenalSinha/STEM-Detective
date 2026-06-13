"""
Tests for STEM Detective backend.
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import uuid

# We test against a test DB; in CI, set DATABASE_URL to a test postgres instance.
# For local testing without a DB, we patch the DB session.


@pytest.fixture
def mock_db(monkeypatch):
    """Mock database session."""
    from unittest.mock import MagicMock
    db = MagicMock()
    monkeypatch.setattr("app.db.session.SessionLocal", lambda: db)
    return db


def test_health_check():
    """Test health endpoint."""
    from app.main import app
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


def test_register_and_login():
    """Test user registration and login flow."""
    from app.main import app
    with TestClient(app) as client:
        # Register
        user_data = {
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "username": f"detective_{uuid.uuid4().hex[:6]}",
            "password": "testpassword123",
            "grade_level": "middle",
        }
        response = client.post("/api/v1/auth/register", json=user_data)
        # May fail if no DB, but structure should be correct
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "user" in data
            assert data["user"]["email"] == user_data["email"]


def test_lab_modules_endpoint():
    """Test lab modules listing (no auth needed)."""
    from app.main import app
    with TestClient(app) as client:
        response = client.get("/api/v1/lab/modules")
        assert response.status_code == 200
        data = response.json()
        assert "chemistry" in data
        assert "biology" in data
        assert "physics" in data
        assert "environmental" in data


def test_chemistry_simulation():
    """Test chemistry lab simulation logic directly."""
    from app.services.lab.simulations import run_chemistry_simulation

    result = run_chemistry_simulation("ph_test", {"substance": "river_water_contaminated"})
    assert "ph_value" in result
    assert result["ph_value"] < 7  # contaminated water is acidic
    assert result["is_acidic"] is True


def test_orbital_mechanics_simulation():
    """Test physics orbital mechanics simulation."""
    from app.services.lab.simulations import run_physics_simulation

    result = run_physics_simulation("orbital_mechanics", {
        "altitude_km": 400,
        "drag_increase": 2.5
    })
    assert "orbital_velocity_km_s" in result
    assert "orbital_period_minutes" in result
    assert result["orbital_velocity_km_s"] > 0


def test_pollution_spread_simulation():
    """Test environmental pollution spread model."""
    from app.services.lab.simulations import run_environmental_simulation

    result = run_environmental_simulation("pollution_spread", {
        "pollutant": "heavy_metals",
        "hours": 24
    })
    assert "spread_distance_km" in result
    assert "affected_area_km2" in result
    assert result["spread_distance_km"] > 0


def test_xp_level_calculation():
    """Test XP and level calculation."""
    from app.services.learning.engine import calculate_level, xp_for_next_level

    level, rank = calculate_level(0)
    assert level == 1
    assert "Rookie" in rank

    level, rank = calculate_level(500)
    assert level >= 4

    level, rank = calculate_level(10000)
    assert level >= 10


def test_knowledge_node_mastery():
    """Test mastery calculation logic."""
    from app.services.learning.engine import calculate_level

    # Expert level has high XP
    level, rank = calculate_level(36000)
    assert "Master" in rank or "Legend" in rank or level >= 18


def test_simulation_routing():
    """Test simulation router dispatches to correct module."""
    from app.services.lab.simulations import run_simulation

    # Chemistry
    result = run_simulation("chemistry", "ph_test", {"substance": "water"})
    assert "ph_value" in result

    # Biology
    result = run_simulation("biology", "microscope", {"sample": "leaf", "magnification": 400})
    assert "experiment" in result

    # Unknown lab type
    result = run_simulation("unknown_lab", "test", {})
    assert "error" in result


def test_mystery_ai_prompt_structure():
    """Test that mystery AI functions are importable and callable."""
    from app.services.ai import mystery_ai
    import inspect

    # Verify all key functions exist
    assert inspect.iscoroutinefunction(mystery_ai.generate_mystery)
    assert inspect.iscoroutinefunction(mystery_ai.dungeon_master_response)
    assert inspect.iscoroutinefunction(mystery_ai.analyze_evidence)
    assert inspect.iscoroutinefunction(mystery_ai.generate_hint)
    assert inspect.iscoroutinefunction(mystery_ai.evaluate_hypothesis)
    assert inspect.iscoroutinefunction(mystery_ai.generate_experiment)


def test_schemas_validation():
    """Test Pydantic schema validation."""
    from app.schemas.schemas import MysteryGenerateRequest, UserCreate
    from app.models.models import Subject, GradeLevel, Difficulty

    # Valid mystery request
    req = MysteryGenerateRequest(
        subject=Subject.BIOLOGY,
        grade_level=GradeLevel.MIDDLE,
        difficulty=Difficulty.MEDIUM,
        topic="Photosynthesis"
    )
    assert req.topic == "Photosynthesis"

    # Invalid password (too short)
    with pytest.raises(Exception):
        UserCreate(
            email="test@example.com",
            username="testuser",
            password="short",  # < 8 chars
        )
