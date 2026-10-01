"""Flagship case API: The Silent Greenhouse.

Premium gating is enforced HERE, server side, using RevenueCat-verified entitlements
(see app/services/billing/revenuecat.py). Gated calls answer 403 with
{"code": "PRO_REQUIRED", "feature": "..."} which the app turns into the paywall.
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.models import Case, User
from app.services.ai import mystery_ai
from app.services.billing import revenuecat as rc
from app.services.flagship import content as C
from app.services.flagship import engine as E

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────

def _case(db: Session, user: User, case_id: uuid.UUID) -> Case:
    case = db.query(Case).filter(Case.id == case_id, Case.student_id == user.id).first()
    if not case or not E.is_flagship(case):
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _pro_required(feature: str):
    raise HTTPException(status_code=403, detail={"code": "PRO_REQUIRED", "feature": feature,
                                                  "message": "This is a Detective Pro feature."})


async def _is_pro(db: Session, user: User) -> bool:
    return (await rc.get_entitlement(db, user)).is_pro


def _bad(e: Exception):
    if isinstance(e, KeyError):
        raise HTTPException(status_code=404, detail=f"Unknown item: {e.args[0]}")
    raise HTTPException(status_code=400, detail=str(e))


# ── schemas ───────────────────────────────────────────────────────────────────

class InspectIn(BaseModel):
    hotspot_id: str


class WitnessIn(BaseModel):
    witness_id: str
    message: Optional[str] = Field(default=None, max_length=400)
    present_evidence: Optional[str] = None


class ProbeIn(BaseModel):
    sample_id: str


class AvailabilityIn(BaseModel):
    ph: float


class FertilizerIn(BaseModel):
    fertilizers: List[str] = Field(min_length=2, max_length=4)


class LimeIn(BaseModel):
    grams_per_litre: float


class LinkIn(BaseModel):
    a: str
    b: str


class HypothesisIn(BaseModel):
    hypothesis: str = Field(min_length=1, max_length=1200)
    evidence: List[str] = Field(default_factory=list, max_length=30)


# ── catalogue & state ─────────────────────────────────────────────────────────

@router.get("/catalog")
async def catalog(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ent = await rc.get_entitlement(db, current_user)
    cases = db.query(Case).filter(Case.student_id == current_user.id).all()
    flagship = next((c for c in cases if E.is_flagship(c)), None)
    ai_cases = [c for c in cases if not E.is_flagship(c)]
    fs = E.get_state(flagship) if flagship else None
    return dict(
        player=E.player_progress(current_user),
        is_pro=ent.is_pro,
        cases=[dict(
            slug=C.SLUG, title=C.TITLE, subtitle=C.SUBTITLE, tier="free", concepts=C.CONCEPTS,
            case_id=str(flagship.id) if flagship else None,
            status="solved" if fs and fs["solved"] else ("in_progress" if flagship else "new"),
            progress=E._progress(fs) if fs else 0,
            blurb="Plants are dying despite normal care. Use chemistry to find out why.",
        )],
        generated=dict(
            count=len(ai_cases),
            limit=None if ent.is_pro else settings.FREE_AI_CASES,
            cases=[dict(case_id=str(c.id), title=c.title, status=c.status.value, topic=c.topic,
                        progress=c.progress_percentage) for c in ai_cases[:20]],
        ),
    )


@router.post("/silent-greenhouse/start")
async def start(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = E.get_or_create_case(db, current_user)
    return E.case_view(db, case, current_user, await _is_pro(db, current_user), settings.FREE_HINTS_PER_CASE)


@router.get("/cases/{case_id}/state")
async def state(case_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    return E.case_view(db, case, current_user, await _is_pro(db, current_user), settings.FREE_HINTS_PER_CASE)


# ── investigation ─────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/inspect")
def inspect(case_id: uuid.UUID, body: InspectIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    try:
        return E.inspect(db, case, current_user, body.hotspot_id)
    except (KeyError, ValueError) as e:
        _bad(e)


@router.post("/cases/{case_id}/witness")
async def witness(case_id: uuid.UUID, body: WitnessIn, current_user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    try:
        res = E.witness_ask(db, case, current_user, body.witness_id, body.message, body.present_evidence)
    except (KeyError, ValueError) as e:
        _bad(e)
    # Optional AI: only when the deterministic matcher found nothing for a typed question.
    # The AI may only use facts the player is already entitled to hear, and never reveals evidence.
    if body.message and not res["matched"] and not body.present_evidence:
        ctx = E.witness_context(case, body.witness_id)
        ai = await mystery_ai.try_json(
            prompt=(f"Character: {ctx['name']}, {ctx['role']}. Manner: {ctx['demeanor']}.\n"
                    f"Facts this character may use (and nothing else): {ctx['facts']}\n"
                    f"Detective asks: {body.message}\n"
                    'Reply in character in at most 45 words. If the facts do not cover it, say you do not know. '
                    'Never state the cause of the plant failure. Return JSON {"reply": "..."}'),
            system="You voice a witness in a detective game. Stay strictly within the provided facts.")
        if ai and isinstance(ai.get("reply"), str) and ai["reply"].strip():
            res["reply"] = ai["reply"].strip()[:400]
            res["ai"] = True
    return res


# ── laboratory ────────────────────────────────────────────────────────────────

@router.get("/lab/curve")
def curve(current_user: User = Depends(get_current_user)):
    return E.curve_table()


@router.get("/lab/fertilizers")
def fertilizers(current_user: User = Depends(get_current_user)):
    return [dict(id=k, name=v["name"], npk=v["npk"]) for k, v in C.FERTILIZERS.items()]


@router.post("/cases/{case_id}/lab/probe")
def probe(case_id: uuid.UUID, body: ProbeIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    try:
        return E.lab_probe(db, case, current_user, body.sample_id)
    except (KeyError, ValueError) as e:
        _bad(e)


@router.post("/cases/{case_id}/lab/availability")
def availability(case_id: uuid.UUID, body: AvailabilityIn, current_user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    try:
        return E.lab_availability(db, case, current_user, body.ph)
    except (KeyError, ValueError) as e:
        _bad(e)


@router.post("/cases/{case_id}/lab/fertilizer")
def fertilizer(case_id: uuid.UUID, body: FertilizerIn, current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    try:
        return E.lab_fertilizer(db, case, current_user, body.fertilizers)
    except (KeyError, ValueError) as e:
        _bad(e)


@router.post("/cases/{case_id}/lab/lime-trial")
async def lime(case_id: uuid.UUID, body: LimeIn, current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    if not await _is_pro(db, current_user):
        _pro_required("advanced_lab")
    try:
        return E.lime_trial(db, case, current_user, body.grams_per_litre)
    except (KeyError, ValueError) as e:
        _bad(e)


@router.post("/cases/{case_id}/analysis/advanced")
async def advanced(case_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    if not await _is_pro(db, current_user):
        _pro_required("advanced_evidence_analysis")
    if len(E.get_state(case)["evidence"]) < 4:
        raise HTTPException(status_code=400, detail="Collect at least four pieces of evidence first.")
    return E.advanced_analysis(db, case, current_user)


# ── reasoning ─────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/link")
def link(case_id: uuid.UUID, body: LinkIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    try:
        return E.link(db, case, current_user, body.a, body.b)
    except (KeyError, ValueError) as e:
        _bad(e)


@router.post("/cases/{case_id}/hint")
async def hint(case_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    pro = await _is_pro(db, current_user)
    res = E.next_hint(db, case, current_user, pro, settings.FREE_HINTS_PER_CASE)
    if not res["allowed"]:
        raise HTTPException(status_code=403, detail={
            "code": "PRO_REQUIRED", "feature": "unlimited_hints",
            "message": f"You have used all {res['limit']} free hints for this case.",
        })
    return res


@router.post("/cases/{case_id}/hypothesis")
async def hypothesis(case_id: uuid.UUID, body: HypothesisIn, current_user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    case = _case(db, current_user, case_id)
    res = E.evaluate(db, case, current_user, body.hypothesis, body.evidence)
    res["feedback"] = E.template_feedback(res)
    res["debrief"] = E.debrief(res["solved"])
    # Optional AI voice: rewrites the feedback but cannot change the verdict or reveal the answer.
    if not res["solved"] and not res["short"]:
        ai = await mystery_ai.try_json(
            prompt=(f"A student detective submitted this hypothesis: {body.hypothesis!r}\n"
                    f"Rubric result (authoritative): {[(c['label'], c['status']) for c in res['components']]}\n"
                    "Write 2 sentences of Socratic feedback naming what is missing and asking one guiding question. "
                    'Do not state the answer. Return JSON {"feedback": "..."}'),
            system="You are a supportive detective mentor. You never give away the solution.")
        if ai and isinstance(ai.get("feedback"), str) and ai["feedback"].strip():
            res["feedback"] = ai["feedback"].strip()[:500]
            res["ai"] = True
    return res
