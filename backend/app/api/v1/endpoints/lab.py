from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from app.db.session import get_db
from app.models.models import User, Case, LabExperiment
from app.schemas.schemas import LabExperimentRequest, LabResultOut
from app.api.deps.auth import get_current_user
from app.services.lab.simulations import run_simulation
from app.services.ai.mystery_ai import generate_experiment
from app.services.learning.engine import award_xp, update_knowledge_node

router = APIRouter()


@router.post("/run", response_model=LabResultOut)
async def run_lab_experiment(
    payload: LabExperimentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run a virtual lab experiment."""
    case = db.query(Case).filter(Case.id == payload.case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Get simulation results
    experiment_type = payload.parameters.get("experiment_type", "default")
    sim_results = run_simulation(payload.lab_type, experiment_type, payload.parameters)

    # Get AI analysis and feedback
    case_context = f"Mystery: {case.title}. Topic: {case.topic}. Subject: {case.subject.value if case.subject else ''}"
    ai_result = await generate_experiment(
        lab_type=payload.lab_type,
        hypothesis=payload.hypothesis,
        case_context=case_context,
        parameters={**payload.parameters, "simulation_results": sim_results},
    )

    # Merge simulation with AI analysis
    merged_results = {**sim_results, **ai_result.get("results", {})}

    experiment = LabExperiment(
        id=uuid.uuid4(),
        case_id=payload.case_id,
        lab_type=payload.lab_type,
        experiment_name=ai_result.get("experiment_name", f"{payload.lab_type} experiment"),
        hypothesis=payload.hypothesis,
        procedure=ai_result.get("procedure", []),
        variables=ai_result.get("variables", {}),
        results=merged_results,
        conclusion=ai_result.get("conclusion", ""),
        is_correct=ai_result.get("is_hypothesis_supported", False),
        xp_earned=ai_result.get("xp_earned", 50),
    )
    db.add(experiment)

    # Award XP
    xp = ai_result.get("xp_earned", 50)
    award_xp(db, current_user, xp, f"Lab experiment: {payload.lab_type}")

    # Update knowledge nodes
    for concept in ai_result.get("stem_concepts_reinforced", []):
        update_knowledge_node(db, str(current_user.id), concept, case.subject, ai_result.get("is_hypothesis_supported", False))

    db.commit()
    db.refresh(experiment)

    return LabResultOut(
        experiment_id=experiment.id,
        results=merged_results,
        conclusion=experiment.conclusion,
        is_correct=experiment.is_correct,
        feedback=ai_result.get("feedback", "Experiment completed."),
        stem_concepts_reinforced=ai_result.get("stem_concepts_reinforced", []),
        xp_earned=xp,
    )


@router.get("/history/{case_id}")
def get_lab_history(
    case_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    experiments = db.query(LabExperiment).filter(LabExperiment.case_id == case_id).all()
    return [
        {
            "id": str(e.id),
            "lab_type": e.lab_type,
            "experiment_name": e.experiment_name,
            "hypothesis": e.hypothesis,
            "conclusion": e.conclusion,
            "is_correct": e.is_correct,
            "xp_earned": e.xp_earned,
            "created_at": e.created_at,
        }
        for e in experiments
    ]


@router.get("/modules")
def get_lab_modules():
    """Return available lab modules and experiment types."""
    return {
        "chemistry": {
            "name": "Chemistry Lab",
            "icon": "flask",
            "color": "#a855f7",
            "experiments": [
                {"id": "ph_test", "name": "pH Testing", "description": "Test acidity and basicity of substances"},
                {"id": "compound_analysis", "name": "Compound Analysis", "description": "Identify chemical compounds"},
                {"id": "reaction_simulation", "name": "Reaction Simulation", "description": "Simulate chemical reactions"},
            ],
        },
        "biology": {
            "name": "Biology Lab",
            "icon": "microscope",
            "color": "#22c55e",
            "experiments": [
                {"id": "microscope", "name": "Microscope Analysis", "description": "Examine samples under microscope"},
                {"id": "dna_analysis", "name": "DNA Analysis", "description": "Perform gel electrophoresis"},
                {"id": "ecosystem_analysis", "name": "Ecosystem Analysis", "description": "Study food chains and ecosystems"},
            ],
        },
        "physics": {
            "name": "Physics Lab",
            "icon": "atom",
            "color": "#3b82f6",
            "experiments": [
                {"id": "orbital_mechanics", "name": "Orbital Mechanics", "description": "Simulate satellite orbits"},
                {"id": "force_analysis", "name": "Force Analysis", "description": "Newton's laws simulations"},
                {"id": "energy_calculations", "name": "Energy Calculations", "description": "Kinetic and potential energy"},
            ],
        },
        "environmental": {
            "name": "Environmental Lab",
            "icon": "leaf",
            "color": "#f59e0b",
            "experiments": [
                {"id": "pollution_spread", "name": "Pollution Spread", "description": "Model how pollutants spread"},
                {"id": "water_quality", "name": "Water Quality", "description": "Analyze water samples"},
                {"id": "weather_analysis", "name": "Weather Analysis", "description": "Atmospheric data analysis"},
            ],
        },
    }
