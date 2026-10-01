"""Flagship case engine: all game logic for The Silent Greenhouse.

Pure functions over a small state dict persisted in ``Case.world_state['flagship']``.
Evidence rows are stored in the existing ``evidence`` table so the legacy evidence
views keep working. XP/levels/achievements reuse the existing learning engine.

Nothing here calls an AI provider; see ``enrich`` helpers in routes for optional polish.
"""
import math
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.models import (
    Case, CaseStatus, Difficulty, Evidence, GradeLevel, LabExperiment, Subject, User,
)
from app.services.learning.engine import (
    DETECTIVE_RANKS, XP_THRESHOLDS, award_xp, calculate_level, check_achievements,
    update_knowledge_node,
)
from . import content as C

FLAG = "flagship"


# ── State ─────────────────────────────────────────────────────────────────────

def new_state() -> dict:
    return dict(
        slug=C.SLUG, inspected=[], evidence=[], inferences=[], witness_log={}, revealed_facts=[],
        labs=[], hints_used=0, hint_levels={}, attempts=0, advanced_used=False,
        solved=False, xp_log={},
    )


def get_state(case: Case) -> dict:
    return dict((case.world_state or {}).get(FLAG) or new_state())


def save_state(case: Case, state: dict) -> None:
    ws = dict(case.world_state or {})
    ws[FLAG] = state
    case.world_state = ws  # reassign so SQLAlchemy sees the JSON change


def is_flagship(case: Case) -> bool:
    return bool((case.world_state or {}).get(FLAG))


# ── Case lifecycle ────────────────────────────────────────────────────────────

def get_or_create_case(db: Session, user: User) -> Case:
    cases = db.query(Case).filter(Case.student_id == user.id).all()
    for c in cases:
        if is_flagship(c) and c.status != CaseStatus.ABANDONED:
            return c
    case = Case(
        student_id=user.id, title=C.TITLE, subject=Subject.ENVIRONMENTAL,
        grade_level=user.grade_level or GradeLevel.MIDDLE, difficulty=Difficulty.MEDIUM,
        topic="Soil pH and nutrient availability", story=C.BRIEFING,
        characters=[{"id": k, "name": w["name"], "role": w["role"]} for k, w in C.WITNESSES.items()],
        clues=[], stem_concepts=C.CONCEPTS, solution="(withheld by server)",
        world_state={FLAG: new_state()}, progress_percentage=0.0,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def _grant_xp(db: Session, user: User, state: dict, key: str, amount: int, reason: str) -> Optional[dict]:
    """Award XP once per key. Returns the award summary or None if already granted."""
    if key in state["xp_log"]:
        return None
    state["xp_log"][key] = amount
    return award_xp(db, user, amount, reason)


def _add_evidence(db: Session, case: Case, state: dict, key: str) -> Tuple[bool, dict]:
    """Collect an evidence item. Returns (newly_added, public dict)."""
    pub = C.evidence_public(key)
    if key in state["evidence"]:
        return False, pub
    e = C.EVIDENCE[key]
    db.add(Evidence(
        case_id=case.id, title=e["title"], description=e["description"], evidence_type=e["kind"],
        content={"flagship_key": key, "tags": e["tags"], "significance": e["significance"]},
        is_key_evidence=e["significance"] == "key",
        relevance_score=1.0 if e["significance"] == "key" else 0.4,
    ))
    state["evidence"].append(key)
    return True, pub


def _progress(state: dict) -> float:
    key_total = sum(1 for e in C.EVIDENCE.values() if e["significance"] == "key" and e["tags"] != ["timeline", "causation"])
    key_have = sum(1 for k in state["evidence"] if C.EVIDENCE[k]["significance"] == "key")
    parts = [
        min(key_have / max(key_total - 2, 1), 1.0) * 55,
        min(len(state["inferences"]) / 6, 1.0) * 25,
        min(len(state["labs"]) / 3, 1.0) * 10,
        10 if state["witness_log"] else 0,
    ]
    return 100.0 if state["solved"] else min(round(sum(parts), 1), 95.0)


def stage_of(state: dict) -> str:
    if state["solved"]:
        return "solved"
    if len(state["evidence"]) < 3:
        return "investigate"
    if not state["labs"]:
        return "lab"
    if len(state["inferences"]) < 3:
        return "connect"
    return "hypothesis"


def player_progress(user: User) -> dict:
    lvl, rank = calculate_level(user.xp)
    lo = XP_THRESHOLDS[lvl - 1] if lvl - 1 < len(XP_THRESHOLDS) else XP_THRESHOLDS[-1]
    hi = XP_THRESHOLDS[lvl] if lvl < len(XP_THRESHOLDS) else lo
    return dict(xp=user.xp, level=lvl, rank=rank, level_floor=lo, level_ceiling=hi,
                xp_in_level=user.xp - lo, xp_span=max(hi - lo, 1))


def case_view(db: Session, case: Case, user: User, is_pro: bool, free_hints: int) -> dict:
    s = get_state(case)
    found = set(s["inspected"])
    samples_unlocked = sorted({sm for h in C.HOTSPOTS if h["id"] in found for sm in h["samples"]})
    unlocked_samples = [
        dict(id=sid, label=C.SAMPLES[sid]["label"], measured=C.SAMPLES[sid]["evidence"] in s["evidence"])
        for sid in samples_unlocked
    ]
    return dict(
        case_id=str(case.id), slug=C.SLUG, title=C.TITLE, subtitle=C.SUBTITLE,
        briefing=C.BRIEFING, objectives=C.OBJECTIVES, concepts=C.CONCEPTS,
        status=case.status.value if hasattr(case.status, "value") else str(case.status),
        solved=s["solved"], stage=stage_of(s), progress=_progress(s),
        hotspots=[dict(id=h["id"], label=h["label"], area=h["area"], prompt=h["prompt"], inspected=h["id"] in found)
                  for h in C.HOTSPOTS],
        evidence=[C.evidence_public(k) for k in s["evidence"]],
        inferences=[dict(id=i["id"], title=i["title"], insight=i["insight"]) for i in C.INFERENCES if i["id"] in s["inferences"]],
        inference_total=len(C.INFERENCES) - 2,  # two inferences require Pro-only lab/analysis
        witnesses=[dict(id=k, name=w["name"], role=w["role"], opening=w["opening"],
                        spoken=len(s["witness_log"].get(k, [])) > 0) for k, w in C.WITNESSES.items()],
        samples=unlocked_samples,
        labs_done=len(s["labs"]),
        hints=dict(used=s["hints_used"], limit=None if is_pro else free_hints,
                   remaining=None if is_pro else max(free_hints - s["hints_used"], 0)),
        advanced=dict(available=len(s["evidence"]) >= 4, used=s["advanced_used"]),
        is_pro=is_pro, debrief=debrief(s["solved"]),
        player=player_progress(user),
    )


# ── Scene ─────────────────────────────────────────────────────────────────────

def inspect(db: Session, case: Case, user: User, hotspot_id: str) -> dict:
    hs = next((h for h in C.HOTSPOTS if h["id"] == hotspot_id), None)
    if not hs:
        raise KeyError(hotspot_id)
    s = get_state(case)
    first = hotspot_id not in s["inspected"]
    if first:
        s["inspected"].append(hotspot_id)
    new_items, awards = [], []
    for key in hs["evidence"]:
        added, pub = _add_evidence(db, case, s, key)
        if added:
            new_items.append(pub)
            amt = C.XP["evidence_key"] if C.EVIDENCE[key]["significance"] == "key" else C.XP["evidence_other"]
            a = _grant_xp(db, user, s, f"ev:{key}", amt, f"Evidence: {C.EVIDENCE[key]['title']}")
            if a:
                awards.append(a)
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    return dict(hotspot_id=hotspot_id, first_visit=first, new_evidence=new_items,
                evidence=[C.evidence_public(k) for k in hs["evidence"]],
                samples_unlocked=hs["samples"], xp=_summ(awards, user))


def _summ(awards: List[dict], user: User) -> dict:
    total = sum(a["xp_awarded"] for a in awards)
    return dict(gained=total, total=user.xp, level=user.level, rank=user.detective_rank,
                leveled_up=any(a["leveled_up"] for a in awards))


# ── Witnesses ─────────────────────────────────────────────────────────────────

def _eligible(entry: dict, have: set) -> bool:
    req = entry.get("requires_any")
    return not req or bool(have & set(req))


def witness_ask(db: Session, case: Case, user: User, witness_id: str,
                message: Optional[str], present: Optional[str]) -> dict:
    w = C.WITNESSES.get(witness_id)
    if not w:
        raise KeyError(witness_id)
    s = get_state(case)
    have = set(s["evidence"])
    if present and present not in have:
        raise ValueError("You have not collected that evidence yet.")

    chosen, matched = None, False
    if present:
        chosen = next((k for k in w["knowledge"] if k.get("present") == present and _eligible(k, have)), None)
        if not chosen:
            reply = f"{w['name'].split()[0]} studies it for a moment. \"That does not change anything I have told you.\""
        else:
            matched = True
    elif message:
        text = message.lower()
        best, best_score = None, 0
        for k in w["knowledge"]:
            if k.get("present") or not _eligible(k, have):
                continue
            score = sum(1 for t in k["triggers"] if t in text)
            if score > best_score:
                best, best_score = k, score
        chosen, matched = best, best is not None
        if not chosen:
            reply = w["fallback"]
    else:
        reply = w["opening"]

    if chosen:
        reply = chosen["text"]

    new_ev, awards = [], []
    if chosen and chosen.get("reveals"):
        added, pub = _add_evidence(db, case, s, chosen["reveals"])
        if added:
            new_ev.append(pub)
            a = _grant_xp(db, user, s, f"ev:{chosen['reveals']}", C.XP["evidence_key"], "Witness testimony")
            if a:
                awards.append(a)
    if chosen and chosen["id"] not in s["revealed_facts"]:
        s["revealed_facts"].append(chosen["id"])

    if message or present:
        log = s["witness_log"].setdefault(witness_id, [])
        log.append(dict(q=message or f"[presented {present}]", matched=matched))
        s["witness_log"][witness_id] = log[-20:]
    elif witness_id not in s["witness_log"]:
        s["witness_log"][witness_id] = []

    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    return dict(witness_id=witness_id, name=w["name"], reply=reply, matched=matched,
                new_evidence=new_ev, xp=_summ(awards, user))


def witness_context(case: Case, witness_id: str) -> dict:
    """Facts a witness may draw on (for optional AI phrasing): only those the player is eligible to hear."""
    s = get_state(case)
    have = set(s["evidence"])
    w = C.WITNESSES[witness_id]
    facts = [k["text"] for k in w["knowledge"] if not k.get("present") and _eligible(k, have)]
    return dict(name=w["name"], role=w["role"], demeanor=w["demeanor"], facts=facts)


# ── Laboratory ────────────────────────────────────────────────────────────────

def interp(nutrient: str, ph: float) -> float:
    """Linear interpolation of the availability curve."""
    g, ys = C.PH_GRID, C.AVAILABILITY[nutrient]
    ph = max(g[0], min(g[-1], ph))
    for i in range(len(g) - 1):
        if g[i] <= ph <= g[i + 1]:
            t = (ph - g[i]) / (g[i + 1] - g[i])
            return round(ys[i] + t * (ys[i + 1] - ys[i]), 1)
    return ys[-1]


def availability_at(ph: float) -> dict:
    rows = []
    for n in C.AVAILABILITY:
        v = interp(n, ph)
        if n in C.TOXIC:
            status = "toxic" if v >= C.TOXIC[n] else "ok"
        else:
            status = "scarce" if v < C.DEFICIENT_BELOW else "ok"
        rows.append(dict(symbol=n, name=C.NUTRIENT_NAMES[n], value=v, status=status, is_toxin=n in C.TOXIC))
    scarce = [r["name"] for r in rows if r["status"] == "scarce"]
    toxic = [r["name"] for r in rows if r["status"] == "toxic"]
    # Liebig's law of the minimum: growth is limited by the scarcest essential nutrient.
    essentials = [r["value"] for r in rows if not r["is_toxin"]]
    limiting = min(essentials)
    toxin_penalty = max(0.0, (interp("Al", ph) - 20) * 0.5, (interp("Mn", ph) - 70) * 0.4)
    vigor = max(0.0, round(limiting - toxin_penalty, 1))
    return dict(ph=round(ph, 2), rows=rows, scarce=scarce, toxic=toxic, vigor_index=vigor)


def _lab_done(db, case, user, s, name, lab_type, hypothesis, results, conclusion, correct) -> dict:
    db.add(LabExperiment(case_id=case.id, lab_type=lab_type, experiment_name=name, hypothesis=hypothesis,
                         procedure=[], variables={}, results=results, conclusion=conclusion,
                         is_correct=correct, xp_earned=C.XP["lab"]))
    tag = f"{name}"
    if tag not in s["labs"]:
        s["labs"].append(tag)
    return None


def lab_probe(db: Session, case: Case, user: User, sample_id: str) -> dict:
    s = get_state(case)
    sm = C.SAMPLES.get(sample_id)
    if not sm:
        raise KeyError(sample_id)
    unlocked = {x for h in C.HOTSPOTS if h["id"] in s["inspected"] for x in h["samples"]}
    if sample_id not in unlocked:
        raise ValueError("You have not collected that sample yet. Inspect its source at the scene first.")
    added, pub = _add_evidence(db, case, s, sm["evidence"])
    awards = []
    if added:
        _lab_done(db, case, user, s, f"pH probe: {sm['label']}", "chemistry", "", {"ph": sm["ph"]},
                  f"{sm['label']} reads pH {sm['ph']}", True)
        a = _grant_xp(db, user, s, f"lab:{sample_id}", C.XP["lab"], f"pH probe: {sm['label']}")
        if a:
            awards.append(a)
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    band = "acidic" if sm["ph"] < 6.0 else ("neutral" if sm["ph"] <= 7.3 else "alkaline")
    return dict(sample=sample_id, label=sm["label"], ph=sm["ph"], tolerance=0.05, band=band,
                target_range=[6.0, 6.5], new_evidence=[pub] if added else [], xp=_summ(awards, user))


def lab_availability(db: Session, case: Case, user: User, ph: float) -> dict:
    if not (3.5 <= ph <= 9.0):
        raise ValueError("pH must be between 3.5 and 9.0")
    s = get_state(case)
    result = availability_at(ph)
    new_ev, awards = [], []
    # Evidence is only produced by analysing a pH that is actually relevant to the case.
    if 4.5 <= ph <= 5.0 and C.SAMPLES["sample_bench_b"]["evidence"] in s["evidence"]:
        added, pub = _add_evidence(db, case, s, "ev_availability")
        if added:
            new_ev.append(pub)
            _lab_done(db, case, user, s, "Nutrient availability model", "chemistry", "", result,
                      "Low pH limits Ca/Mg/P/Mo and mobilises Mn/Al", True)
            a = _grant_xp(db, user, s, "lab:availability", C.XP["lab"], "Nutrient availability analysis")
            if a:
                awards.append(a)
            update_knowledge_node(db, str(user.id), "Nutrient availability", Subject.CHEMISTRY, True)
    result["hint"] = None
    if not new_ev and "ev_availability" not in s["evidence"]:
        if C.SAMPLES["sample_bench_b"]["evidence"] not in s["evidence"]:
            result["hint"] = "Model a pH you have actually measured. Probe a failing bench first."
        else:
            result["hint"] = "Set the model to the pH you measured on Bench B to see what the roots experience."
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    result.update(new_evidence=new_ev, xp=_summ(awards, user))
    return result


def curve_table() -> dict:
    return dict(ph_grid=C.PH_GRID, series=C.AVAILABILITY, names=C.NUTRIENT_NAMES,
                toxic=C.TOXIC, deficient_below=C.DEFICIENT_BELOW,
                disclaimer="Teaching model adapted from published soil-pH availability charts. Illustrative, not lab-grade.")


def lab_fertilizer(db: Session, case: Case, user: User, ids: List[str]) -> dict:
    ids = list(dict.fromkeys(ids))
    if len(ids) < 2:
        raise ValueError("Select at least two fertilizers to compare.")
    bad = [i for i in ids if i not in C.FERTILIZERS]
    if bad:
        raise KeyError(bad[0])
    s = get_state(case)
    rows = []
    for i in ids:
        f = C.FERTILIZERS[i]
        rows.append(dict(id=i, name=f["name"], npk=f["npk"], acidity=f["acidity"],
                         direction="acid-forming" if f["acidity"] > 0 else "basic",
                         note=f["note"]))
    rows.sort(key=lambda r: -r["acidity"])
    new_ev, awards = [], []
    if {"ammonium_sulfate", "calcium_nitrate"} <= set(ids):
        added, pub = _add_evidence(db, case, s, "ev_fert_acidity")
        if added:
            new_ev.append(pub)
            _lab_done(db, case, user, s, "Fertilizer acidity comparison", "chemistry", "", {"rows": rows},
                      "Ammonium sulfate is acid-forming; calcium nitrate is not", True)
            a = _grant_xp(db, user, s, "lab:fert", C.XP["lab"], "Fertilizer acidity comparison")
            if a:
                awards.append(a)
            update_knowledge_node(db, str(user.id), "Fertilizer acidity", Subject.CHEMISTRY, True)
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    return dict(rows=rows, unit="lb CaCO3 needed to neutralise 100 lb of product (approximate)",
                new_evidence=new_ev, xp=_summ(awards, user))


def lime_trial(db: Session, case: Case, user: User, grams_per_litre: float) -> dict:
    """Controlled experiment (Pro): treat Bench B substrate with dolomitic lime, compare to an untreated control."""
    if not (0 < grams_per_litre <= 10):
        raise ValueError("Choose a lime dose between 0 and 10 g/L.")
    s = get_state(case)
    if C.SAMPLES["sample_bench_b"]["evidence"] not in s["evidence"]:
        raise ValueError("Measure Bench B's pH before you try to treat it.")
    g = grams_per_litre
    treated_ph = round(C.LIME_MAX_PH - (C.LIME_MAX_PH - C.BENCH_B_PH) * math.exp(-C.LIME_RATE * g), 2)
    control = availability_at(C.BENCH_B_PH)
    treated = availability_at(treated_ph)
    overlimed = treated_ph > 7.0
    success = 5.8 <= treated_ph <= 7.0
    new_ev, awards = [], []
    if success:
        added, pub = _add_evidence(db, case, s, "ev_lime_trial")
        if added:
            new_ev.append(pub)
            _lab_done(db, case, user, s, "Controlled lime trial", "chemistry", "Raising pH restores nutrient balance",
                      dict(control=control, treated=treated, dose=g), "Correcting pH restores predicted vigor", True)
            a = _grant_xp(db, user, s, "lab:lime", C.XP["lab"] + 20, "Controlled lime trial")
            if a:
                awards.append(a)
            update_knowledge_node(db, str(user.id), "Experimental controls", Subject.ENVIRONMENTAL, True)
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    note = ("Overshoot: above pH 7 phosphorus, iron and manganese start to become scarce. Try a lower dose."
            if overlimed else
            "Good range. The untreated control stayed acidic, so the change is due to the lime." if success else
            "Not enough lime to bring the substrate into range. Increase the dose.")
    return dict(dose=g, control=control, treated=treated, treated_ph=treated_ph, overlimed=overlimed,
                success=success, note=note, new_evidence=new_ev, xp=_summ(awards, user))


def _pearson(xs, ys) -> float:
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    if sxx == 0 or syy == 0:
        return 0.0
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / math.sqrt(sxx * syy)


def advanced_analysis(db: Session, case: Case, user: User) -> dict:
    """Advanced evidence analysis (Pro): computed from the logger dataset, not canned text."""
    s = get_state(case)
    days, a, b = C.LOGGER_DAYS, C.LOGGER_BENCH_A, C.LOGGER_BENCH_B
    post = [(d, pb) for d, pb in zip(days, b) if d >= 0]
    dose_days = [d + 1 for d, _ in post]  # cumulative days on ammonium sulfate
    r = _pearson(dose_days, [p for _, p in post])
    slope_b = (post[-1][1] - post[0][1]) / max(post[-1][0] - post[0][0], 1)
    post_a = [(d, pa) for d, pa in zip(days, a) if d >= 0]
    slope_a = (post_a[-1][1] - post_a[0][1]) / max(post_a[-1][0] - post_a[0][0], 1)
    cross = next((d for d, pb in zip(days, b) if pb < C.TOXICITY_PH), None)
    lead = (C.SYMPTOM_ONSET_DAY - cross) if cross is not None else None
    added, pub = _add_evidence(db, case, s, "ev_timeline")
    awards = []
    if added:
        s["advanced_used"] = True
        a_ = _grant_xp(db, user, s, "analysis:timeline", 60, "Advanced evidence analysis")
        if a_:
            awards.append(a_)
        update_knowledge_node(db, str(user.id), "Experimental reasoning", Subject.ENVIRONMENTAL, True)
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    return dict(
        days=days, bench_a=a, bench_b=b, switch_day=0, symptom_day=C.SYMPTOM_ONSET_DAY,
        threshold=C.TOXICITY_PH, threshold_crossed_day=cross, lead_days=lead,
        correlation=round(r, 3), slope_b_per_day=round(slope_b, 3), slope_a_per_day=round(slope_a, 3),
        findings=[
            f"Bench B pH falls about {abs(slope_b):.2f} units per day after the fertilizer switch (Bench A: {slope_a:+.3f}).",
            f"Correlation between days on the new fertilizer and pH is r = {r:.2f}: a near-linear decline.",
            (f"pH crossed {C.TOXICITY_PH} on Day {cross}, {lead} day(s) before symptoms appeared on Day {C.SYMPTOM_ONSET_DAY}. "
             "The cause came first." if lead and lead > 0 else "The pH drop did not clearly precede symptoms."),
        ],
        caveat="Correlation plus timing supports, but does not prove, causation. The lime trial is what tests it.",
        new_evidence=[pub] if added else [], xp=_summ(awards, user),
    )


# ── Connections ───────────────────────────────────────────────────────────────

def link(db: Session, case: Case, user: User, a: str, b: str) -> dict:
    s = get_state(case)
    have = set(s["evidence"])
    if a == b or a not in have or b not in have:
        raise ValueError("Both pieces of evidence must be in your case file.")
    pair = {a, b}
    match = next((i for i in C.INFERENCES if any(set(p) == pair for p in i["pairs"])), None)
    if not match:
        return dict(valid=False, message="These two facts do not constrain each other yet. Ask what question each one answers, then look for a pair that answers it together.")
    if match["id"] in s["inferences"]:
        return dict(valid=True, new=False, inference=dict(id=match["id"], title=match["title"], insight=match["insight"]),
                    xp=_summ([], user))
    s["inferences"].append(match["id"])
    a_ = _grant_xp(db, user, s, f"inf:{match['id']}", C.XP["inference"], f"Inference: {match['title']}")
    case.progress_percentage = _progress(s)
    save_state(case, s)
    db.commit()
    return dict(valid=True, new=True, inference=dict(id=match["id"], title=match["title"], insight=match["insight"]),
                total_inferences=len(s["inferences"]), xp=_summ([a_] if a_ else [], user))


def overlooked_relationship(case: Case) -> Optional[Tuple[str, str]]:
    """A valid but not-yet-made connection among evidence the player already holds."""
    s = get_state(case)
    have = set(s["evidence"])
    for inf in C.INFERENCES:
        if inf["id"] in s["inferences"]:
            continue
        for x, y in inf["pairs"]:
            if x in have and y in have:
                return x, y
    return None


# ── Hints ─────────────────────────────────────────────────────────────────────

def _hint_ladder(s: dict) -> Tuple[str, List[str]]:
    ev = set(s["evidence"])
    if len(ev) < 3:
        return "scene", [
            "Start with what you can observe. Compare the failing bench with the healthy one. What is different, and what is the same?",
            "Visit the growing floor, the control room and the plant room. Each holds evidence. Look for the healthy bench as your control.",
            "Inspect Bench A, Bench B and the roots, then read the climate logger. Note what is identical between benches.",
        ]
    if "ev_ph_b" not in ev:
        return "measure", [
            "Plants cannot tell you what is wrong with their soil. Which instrument measures a property of the substrate itself?",
            "Collect substrate samples at the benches, then use the pH probe in the lab. Measure both the healthy and the failing bench.",
            "Probe the Bench A and Bench B substrate samples and compare the two readings.",
        ]
    if "ev_ph_water" not in ev:
        return "water", [
            "Bench B is much more acidic than Bench A. Could the acid be arriving with the water? How would you test that?",
            "All benches share one reservoir. Collect a water sample from the irrigation reservoir and probe it.",
            "If the shared water is near neutral it cannot be what made only Bench B acidic. Probe the reservoir sample.",
        ]
    if "ev_fertilizer_bag" not in ev and "ev_w_teo_switch" not in ev:
        return "difference", [
            "The water is fine and is shared. So what else is given to the benches that could differ between them?",
            "Ask Teo what he feeds each bench, and check the supply shed.",
            "Look in the supply shed and ask Teo about the new stock.",
        ]
    if "ev_fert_acidity" not in ev:
        return "chemistry", [
            "A fertilizer changed. Does the kind of fertilizer matter for substrate pH? Compare the old and new in the lab.",
            "Open the fertilizer comparison in the lab and compare ammonium sulfate with calcium nitrate.",
            "Compare ammonium sulfate and calcium nitrate and look at which direction each pushes pH.",
        ]
    if "ev_availability" not in ev:
        return "mechanism", [
            "You know the substrate is acidic. Why would acidity hurt a plant? Think about what pH does to nutrients in the soil.",
            "Use the nutrient availability model in the lab at the pH you measured on Bench B.",
            "Set the availability model to about pH 4.7 and read which nutrients are scarce and which are toxic.",
        ]
    if len(s["inferences"]) < 4:
        return "connect", [
            "You have good evidence. Facts become conclusions when you connect them. Which two pieces answer a question together?",
            "Try linking a measurement with the thing that explains it, for example a pH reading with the nutrient model.",
            "Connect the fertilizer label with the acidity comparison, and the water test with the shared reservoir.",
        ]
    return "hypothesis", [
        "A strong hypothesis states what went wrong, why it happened, and what you ruled out. Cite the evidence for each part.",
        "Cover three things: the substrate problem, the cause behind it, and the mechanism that harmed the plants.",
        "Name the pH problem, what caused it on Benches B and C only, how low pH harms nutrient uptake, and what you ruled out.",
    ]


def next_hint(db: Session, case: Case, user: User, is_pro: bool, free_limit: int) -> dict:
    s = get_state(case)
    if not is_pro and s["hints_used"] >= free_limit:
        return dict(allowed=False, reason="hint_limit", used=s["hints_used"], limit=free_limit)
    stage, ladder = _hint_ladder(s)
    lvl = min(s["hint_levels"].get(stage, 0), len(ladder) - 1)
    text = ladder[lvl]
    s["hint_levels"][stage] = lvl + 1
    s["hints_used"] += 1
    extra = None
    if is_pro:
        rel = overlooked_relationship(case)
        if rel:
            extra = dict(a=rel[0], b=rel[1],
                         text=f"You may be overlooking a relationship between \"{C.EVIDENCE[rel[0]]['title']}\" and \"{C.EVIDENCE[rel[1]]['title']}\".")
    save_state(case, s)
    db.commit()
    return dict(allowed=True, stage=stage, level=lvl + 1, text=text, detective_insight=extra,
                used=s["hints_used"], limit=None if is_pro else free_limit)


# ── Hypothesis ────────────────────────────────────────────────────────────────

_ACID = re.compile(r"\b(acid|acidic|acidity|acidif\w*|low(er|ered)? ph|ph (was |is )?(too )?low|ph (of )?[3-5](\.\d)?|ph (dropp?ed|fell|declin\w*))")
_FERT = re.compile(r"(fertili[sz]er|ammonium|sulfate|sulphate|nitrogen source|feed)")
_CHANGE = re.compile(r"(switch|chang|new |replac|cheap|swap|substitut|acid[- ]forming|acidif|instead of|supplier)")
_MECH = re.compile(r"(lock\w*|availab\w*|uptake|absor\w*|deficien\w*|toxic\w*|alumin\w*|mangan\w*|calcium|magnesium|phosph\w*|nutrient)")
_RULE = re.compile(r"(rule[sd]? out|ruled out|not (the )?(cause|water|light|temperature|climate|pest)|isn'?t|wasn'?t|neither|excluded|eliminated|fine|normal|healthy bench|control)")
_RULE_TOPIC = re.compile(r"(water|light|lamp|temperature|climate|pest|disease|pathogen|fung)")


def evaluate(db: Session, case: Case, user: User, hypothesis: str, cited: List[str]) -> dict:
    s = get_state(case)
    text = " ".join(hypothesis.lower().split())
    cited_set = set(cited) & set(s["evidence"])
    has_acid = bool(_ACID.search(text))
    has_fert = bool(_FERT.search(text)) and bool(_CHANGE.search(text))
    has_mech = bool(_MECH.search(text)) and (has_acid or "ph" in text or "lock" in text or "uptake" in text)
    has_rule = (bool(_RULE.search(text)) and bool(_RULE_TOPIC.search(text))) or len(cited_set & C.RULED_OUT) >= 2

    sup_acid = bool(cited_set & C.SUPPORT_ACID)
    sup_fert = bool(cited_set & C.SUPPORT_CAUSE)
    sup_mech = bool(cited_set & C.SUPPORT_MECH)
    sup_rule = len(cited_set & C.RULED_OUT) >= 1 or has_rule

    def part(claimed, supported, weight):
        return weight if (claimed and supported) else (weight * 0.4 if claimed else 0.0)

    comps = [
        dict(id="acidity", label="Identifies the acidic substrate", weight=0.25, claimed=has_acid, supported=sup_acid),
        dict(id="cause", label="Names the cause: the switch to an acid-forming fertilizer", weight=0.35, claimed=has_fert, supported=sup_fert),
        dict(id="mechanism", label="Explains the mechanism: pH limits nutrient availability", weight=0.25, claimed=has_mech, supported=sup_mech),
        dict(id="ruled_out", label="Rules out water, climate, light or pests", weight=0.15, claimed=has_rule, supported=sup_rule),
    ]
    score = 0.0
    for c in comps:
        c["points"] = round(part(c["claimed"], c["supported"], c["weight"]), 3)
        score += c["points"]
        c["status"] = "strong" if c["claimed"] and c["supported"] else ("unsupported" if c["claimed"] else "missing")
    score = round(score, 2)
    solved = comps[1]["status"] == "strong" and score >= 0.7
    short = len(text.split()) < 6

    s["attempts"] += 1
    xp_detail, awards, ach = [], [], []
    if solved and not s["solved"]:
        s["solved"] = True
        case.status = CaseStatus.COMPLETED
        case.is_solved = True
        case.progress_percentage = 100.0
        case.completed_at = datetime.now(timezone.utc)
        case.student_hypothesis = hypothesis
        a = _grant_xp(db, user, s, "solve", C.XP["solve"], "Case solved: The Silent Greenhouse")
        if a:
            awards.append(a)
            xp_detail.append(dict(label="Case solved", xp=C.XP["solve"]))
        if s["hints_used"] == 0:
            a = _grant_xp(db, user, s, "bonus:nohints", C.XP["bonus_no_hints"], "Bonus: no hints")
            xp_detail.append(dict(label="No hints used", xp=C.XP["bonus_no_hints"]))
            awards.append(a)
        if len(s["inferences"]) >= 6:
            a = _grant_xp(db, user, s, "bonus:infer", C.XP["bonus_inferences"], "Bonus: thorough reasoning")
            xp_detail.append(dict(label="Thorough reasoning", xp=C.XP["bonus_inferences"]))
            awards.append(a)
        if len(s["labs"]) >= 3:
            a = _grant_xp(db, user, s, "bonus:lab", C.XP["bonus_lab"], "Bonus: laboratory work")
            xp_detail.append(dict(label="Laboratory work", xp=C.XP["bonus_lab"]))
            awards.append(a)
        awards = [x for x in awards if x]
        for concept, subj in (("Soil pH", Subject.CHEMISTRY), ("Fertilizer acidity", Subject.CHEMISTRY),
                              ("Nutrient availability", Subject.BIOLOGY)):
            update_knowledge_node(db, str(user.id), concept, subj, True)
        n = db.query(Case).filter(Case.student_id == user.id, Case.is_solved == True).count()  # noqa: E712
        ach += check_achievements(db, user, "case_solved", {"total_cases_solved": n})
        if n == 1:
            ach += check_achievements(db, user, "first_case", {})
        ach += check_achievements(db, user, "xp_milestone", {})
    else:
        case.student_hypothesis = hypothesis
    save_state(case, s)
    db.commit()
    db.refresh(user)
    return dict(
        solved=solved, already_solved=bool(s["solved"] and not solved), score=score, short=short,
        components=comps, attempts=s["attempts"], xp_breakdown=xp_detail, xp=_summ(awards, user),
        achievements=ach, player=player_progress(user),
        missing=[c["id"] for c in comps if c["status"] != "strong"],
    )


def template_feedback(result: dict) -> str:
    comps = {c["id"]: c for c in result["components"]}
    if result["solved"]:
        return ("Case closed. You traced the failure to an acid-forming fertilizer, showed how low pH "
                "limits nutrient availability, and ruled out the other suspects using your control bench.")
    if result["short"]:
        return "Your hypothesis is too brief to test. State what went wrong, what caused it, and how it harmed the plants, and cite your evidence."
    msgs = []
    if comps["acidity"]["status"] == "missing":
        msgs.append("You have not yet said what is wrong with the substrate itself.")
    if comps["cause"]["status"] == "missing":
        msgs.append("You describe a problem but not what changed on Benches B and C and not A. What was different?")
    elif comps["cause"]["status"] == "unsupported":
        msgs.append("You name a cause, but none of your cited evidence supports it. Cite the evidence that shows what changed.")
    if comps["mechanism"]["status"] == "missing":
        msgs.append("Explain how the problem harms the plants. What does the condition do to nutrients?")
    elif comps["mechanism"]["status"] == "unsupported":
        msgs.append("Your mechanism needs evidence, such as the nutrient availability model or the symptoms.")
    if comps["ruled_out"]["status"] == "missing":
        msgs.append("Say what you ruled out, and cite the evidence that rules it out.")
    if comps["acidity"]["status"] == "unsupported":
        msgs.append("Back up the acidity claim with your pH measurements.")
    return " ".join(msgs[:3]) or "You are close. Tighten the link between cause, mechanism and evidence."


def debrief(solved: bool) -> Optional[dict]:
    if not solved:
        return None
    return dict(
        title="What really happened",
        body=("Ammonium sulfate is acid-forming. Bacteria in the substrate convert ammonium to nitrate and release hydrogen "
              "ions, and peat mix has little buffering, so the pH slid from about 6.3 to 4.7. At that pH calcium, magnesium, "
              "phosphorus and molybdenum become hard for roots to absorb, while manganese and aluminium dissolve to toxic "
              "levels and damage root tips. Bench A, still on calcium nitrate, stayed in range."),
        concepts=C.CONCEPTS,
        real_world="Growers monitor substrate pH and choose nitrogen sources partly for their effect on it. Liming is the standard correction.",
    )
