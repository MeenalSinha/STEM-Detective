"""End-to-end tests for The Silent Greenhouse, billing and security fixes.
Run against Postgres (DATABASE_URL). No AI keys or RevenueCat network access needed."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.billing import revenuecat as rc
from app.services.flagship import content as C
from app.services.flagship import engine as E


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _register(client, role="student"):
    tag = uuid.uuid4().hex[:8]
    r = client.post("/api/v1/auth/register", json=dict(
        email=f"t_{tag}@example.com", username=f"det_{tag}", password="password123", role=role))
    assert r.status_code == 200, r.text
    d = r.json()
    return d["user"], {"Authorization": f"Bearer {d['access_token']}"}


@pytest.fixture
def player(client):
    user, h = _register(client)
    r = client.post("/api/v1/flagship/silent-greenhouse/start", headers=h)
    assert r.status_code == 200, r.text
    return dict(user=user, h=h, cid=r.json()["case_id"], client=client)


def post(p, path, body=None):
    return p["client"].post(f"/api/v1/flagship/cases/{p['cid']}/{path}", json=body or {}, headers=p["h"])


def state(p):
    return p["client"].get(f"/api/v1/flagship/cases/{p['cid']}/state", headers=p["h"]).json()


@pytest.fixture
def pro(monkeypatch):
    monkeypatch.setattr(settings, "REVENUECAT_SECRET_API_KEY", "sk_test_fake")

    async def fake(uid):
        return rc.EntitlementState(is_pro=True, product_id="pro_monthly", checked_at=datetime.now(timezone.utc))
    monkeypatch.setattr(rc, "fetch_remote", fake)


def play_to_evidence(p):
    for h in ["h_bench_a", "h_bench_b", "h_roots", "h_logger", "h_microscope", "h_reservoir", "h_shed", "h_logbook"]:
        assert post(p, "inspect", {"hotspot_id": h}).status_code == 200
    for s in ["sample_bench_a", "sample_bench_b", "sample_water"]:
        assert post(p, "lab/probe", {"sample_id": s}).status_code == 200
    assert post(p, "lab/availability", {"ph": 4.7}).status_code == 200
    assert post(p, "lab/fertilizer", {"fertilizers": ["ammonium_sulfate", "calcium_nitrate"]}).status_code == 200


# ── security ──────────────────────────────────────────────────────────────────

def test_cannot_self_register_as_admin(client):
    tag = uuid.uuid4().hex[:8]
    r = client.post("/api/v1/auth/register", json=dict(
        email=f"a_{tag}@example.com", username=f"adm_{tag}", password="password123", role="admin"))
    assert r.status_code == 422


def test_case_is_private_to_owner(client, player):
    _, other = _register(client)
    r = client.get(f"/api/v1/flagship/cases/{player['cid']}/state", headers=other)
    assert r.status_code == 404


def test_requires_auth(client):
    assert client.get("/api/v1/flagship/catalog").status_code in (401, 403)


# ── core loop ─────────────────────────────────────────────────────────────────

def test_start_is_idempotent(player):
    r = player["client"].post("/api/v1/flagship/silent-greenhouse/start", headers=player["h"])
    assert r.json()["case_id"] == player["cid"]


def test_evidence_xp_is_awarded_once(player):
    a = post(player, "inspect", {"hotspot_id": "h_bench_b"}).json()
    assert a["xp"]["gained"] > 0 and len(a["new_evidence"]) == 1
    b = post(player, "inspect", {"hotspot_id": "h_bench_b"}).json()
    assert b["xp"]["gained"] == 0 and b["new_evidence"] == []


def test_probe_requires_collected_sample(player):
    r = post(player, "lab/probe", {"sample_id": "sample_bench_b"})
    assert r.status_code == 400
    post(player, "inspect", {"hotspot_id": "h_bench_b"})
    r = post(player, "lab/probe", {"sample_id": "sample_bench_b"})
    assert r.status_code == 200 and r.json()["ph"] == 4.7 and r.json()["band"] == "acidic"


def test_availability_model_matches_chemistry():
    at47 = {r["symbol"]: r for r in E.availability_at(4.7)["rows"]}
    assert at47["Ca"]["status"] == "scarce" and at47["P"]["status"] == "scarce"
    assert at47["Mn"]["status"] == "toxic" and at47["Al"]["status"] == "toxic"
    at64 = E.availability_at(6.4)
    assert at64["scarce"] == [] and at64["toxic"] == []
    assert E.availability_at(6.4)["vigor_index"] > E.availability_at(4.7)["vigor_index"]


def test_availability_evidence_needs_relevant_ph(player):
    post(player, "inspect", {"hotspot_id": "h_bench_b"})
    post(player, "lab/probe", {"sample_id": "sample_bench_b"})
    r = post(player, "lab/availability", {"ph": 7.0}).json()
    assert r["new_evidence"] == []
    r = post(player, "lab/availability", {"ph": 4.7}).json()
    assert len(r["new_evidence"]) == 1


def test_witness_reveals_and_presenting_evidence(player):
    r = post(player, "witness", {"witness_id": "teo", "message": "Did anything change with the fertilizer?"}).json()
    assert r["matched"] and r["new_evidence"][0]["key"] == "ev_w_teo_switch"
    # Pruitt deflects until confronted with evidence
    r = post(player, "witness", {"witness_id": "pruitt", "message": "why did you change the fertilizer supplier?"}).json()
    assert r["new_evidence"] == []
    r = post(player, "witness", {"witness_id": "pruitt", "present_evidence": "ev_w_teo_switch"}).json()
    assert r["new_evidence"][0]["key"] == "ev_w_pruitt_supplier"
    # cannot present evidence you do not hold
    assert post(player, "witness", {"witness_id": "pruitt", "present_evidence": "ev_ph_b"}).status_code == 400


def test_linking_validates(player):
    play_to_evidence(player)
    bad = post(player, "link", {"a": "ev_ph_a", "b": "ev_roots"}).json()
    assert bad["valid"] is False
    good = post(player, "link", {"a": "ev_ph_a", "b": "ev_ph_b"}).json()
    assert good["valid"] and good["new"] and good["xp"]["gained"] == C.XP["inference"]
    again = post(player, "link", {"a": "ev_ph_b", "b": "ev_ph_a"}).json()
    assert again["valid"] and again["new"] is False and again["xp"]["gained"] == 0
    assert post(player, "link", {"a": "ev_timeline", "b": "ev_ph_b"}).status_code == 400  # not collected


# ── hypothesis: never auto-passes ─────────────────────────────────────────────

GOOD = ("Bench B and C were switched to ammonium sulfate, an acid-forming fertilizer. It acidified the substrate to "
        "pH 4.7, which locks out calcium, magnesium and phosphorus and makes manganese and aluminium toxic. "
        "The water is neutral and shared, and climate and pests are normal, so they are ruled out.")
GOOD_EV = ["ev_fertilizer_bag", "ev_fert_acidity", "ev_ph_b", "ev_availability", "ev_ph_water", "ev_climate_ok"]


def test_nonsense_hypothesis_fails(player):
    play_to_evidence(player)
    r = post(player, "hypothesis", {"hypothesis": "aliens did it with lasers", "evidence": ["ev_ph_b"]}).json()
    assert r["solved"] is False and r["score"] < 0.3
    assert not state(player)["solved"]


def test_unsupported_claim_is_not_enough(player):
    play_to_evidence(player)
    r = post(player, "hypothesis", {"hypothesis": GOOD, "evidence": []}).json()
    assert r["solved"] is False
    assert any(c["status"] == "unsupported" for c in r["components"])


def test_wrong_cause_even_with_acidity_fails(player):
    play_to_evidence(player)
    r = post(player, "hypothesis", {"hypothesis": "The substrate is acidic at pH 4.7 and the water was contaminated.",
                                    "evidence": ["ev_ph_b"]}).json()
    assert r["solved"] is False and "cause" in r["missing"]


def test_good_hypothesis_solves_once_and_awards_xp_once(player):
    play_to_evidence(player)
    before = state(player)["player"]["xp"]
    r = post(player, "hypothesis", {"hypothesis": GOOD, "evidence": GOOD_EV}).json()
    assert r["solved"] and r["score"] >= 0.7 and r["debrief"]
    assert r["xp"]["gained"] >= C.XP["solve"]
    after = state(player)
    assert after["solved"] and after["player"]["xp"] >= before + C.XP["solve"]
    r2 = post(player, "hypothesis", {"hypothesis": GOOD, "evidence": GOOD_EV}).json()
    assert r2["xp"]["gained"] == 0  # no XP farming
    assert state(player)["player"]["xp"] == after["player"]["xp"]


def test_first_case_achievement_unlocks(client, player):
    play_to_evidence(player)
    r = post(player, "hypothesis", {"hypothesis": GOOD, "evidence": GOOD_EV}).json()
    assert "First Case" in [a["name"] for a in r["achievements"]]


# ── hints & Pro gating (server enforced) ──────────────────────────────────────

def test_free_hint_limit_then_paywall(player):
    for i in range(settings.FREE_HINTS_PER_CASE):
        assert post(player, "hint").status_code == 200
    r = post(player, "hint")
    assert r.status_code == 403 and r.json()["detail"]["code"] == "PRO_REQUIRED"


def test_hints_escalate_within_a_stage(player):
    texts = [post(player, "hint").json()["text"] for _ in range(3)]
    assert len(set(texts)) == 3


def test_pro_features_blocked_for_free(player):
    play_to_evidence(player)
    for path, body in [("lab/lime-trial", {"grams_per_litre": 4}), ("analysis/advanced", {})]:
        r = post(player, path, body)
        assert r.status_code == 403 and r.json()["detail"]["code"] == "PRO_REQUIRED", path


def test_pro_unlocks_lime_trial_advanced_and_unlimited_hints(player, pro):
    play_to_evidence(player)
    for _ in range(settings.FREE_HINTS_PER_CASE + 2):
        assert post(player, "hint").status_code == 200
    under = post(player, "lab/lime-trial", {"grams_per_litre": 1}).json()
    assert under["success"] is False and under["new_evidence"] == []
    over = post(player, "lab/lime-trial", {"grams_per_litre": 10}).json()
    assert over["overlimed"] and not over["success"]
    ok = post(player, "lab/lime-trial", {"grams_per_litre": 4}).json()
    assert ok["success"] and 5.8 <= ok["treated_ph"] <= 7.0 and ok["control"]["ph"] == 4.7
    assert ok["treated"]["vigor_index"] > ok["control"]["vigor_index"]
    adv = post(player, "analysis/advanced").json()
    assert adv["lead_days"] == 1 and adv["correlation"] < -0.9 and adv["threshold_crossed_day"] == 5


def test_pro_hint_points_at_overlooked_relationship(player, pro):
    play_to_evidence(player)
    h = post(player, "hint").json()
    assert h["detective_insight"] and "overlooking" in h["detective_insight"]["text"]


# ── billing ───────────────────────────────────────────────────────────────────

def test_parse_subscriber_active_expired_lifetime():
    future = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat().replace("+00:00", "Z")
    past = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat().replace("+00:00", "Z")
    ent = lambda exp: {"subscriber": {"entitlements": {"pro": {"expires_date": exp, "product_identifier": "x"}}}}
    assert rc.parse_subscriber(ent(future)).is_pro
    assert not rc.parse_subscriber(ent(past)).is_pro
    assert rc.parse_subscriber(ent(None)).is_pro
    assert not rc.parse_subscriber({"subscriber": {"entitlements": {}}}).is_pro


def test_entitlement_endpoint_reports_unconfigured(client, player, monkeypatch):
    monkeypatch.setattr(settings, "REVENUECAT_SECRET_API_KEY", "")
    r = client.get("/api/v1/billing/entitlement", headers=player["h"]).json()
    assert r["is_pro"] is False and r["billing_configured"] is False


def test_entitlement_grace_period_when_revenuecat_down(client, player, monkeypatch):
    monkeypatch.setattr(settings, "REVENUECAT_SECRET_API_KEY", "sk_test_fake")
    calls = {"n": 0}

    async def flaky(uid):
        calls["n"] += 1
        if calls["n"] == 1:
            return rc.EntitlementState(is_pro=True, product_id="p", checked_at=datetime.now(timezone.utc))
        raise RuntimeError("down")
    monkeypatch.setattr(rc, "fetch_remote", flaky)
    assert client.get("/api/v1/billing/entitlement?refresh=true", headers=player["h"]).json()["is_pro"] is True
    r = client.get("/api/v1/billing/entitlement?refresh=true", headers=player["h"]).json()
    assert r["is_pro"] is True and r["stale"] is True  # paying users survive an outage


def test_webhook_requires_auth_and_refreshes(client, player, monkeypatch):
    monkeypatch.setattr(settings, "REVENUECAT_WEBHOOK_AUTH", "Bearer whsec")
    monkeypatch.setattr(settings, "REVENUECAT_SECRET_API_KEY", "sk_test_fake")
    body = {"event": {"type": "INITIAL_PURCHASE", "app_user_id": player["user"]["id"]}}
    assert client.post("/api/v1/billing/webhook/revenuecat", json=body).status_code == 401
    assert client.post("/api/v1/billing/webhook/revenuecat", json=body, headers={"Authorization": "wrong"}).status_code == 401

    async def active(uid):
        return rc.EntitlementState(is_pro=True, product_id="pro_annual", checked_at=datetime.now(timezone.utc))
    monkeypatch.setattr(rc, "fetch_remote", active)
    ok = client.post("/api/v1/billing/webhook/revenuecat", json=body, headers={"Authorization": "Bearer whsec"})
    assert ok.status_code == 200 and ok.json()["handled"] == 1
    assert client.get("/api/v1/billing/entitlement", headers=player["h"]).json()["is_pro"] is True


def test_webhook_disabled_without_configured_secret(client, monkeypatch):
    monkeypatch.setattr(settings, "REVENUECAT_WEBHOOK_AUTH", "")
    assert client.post("/api/v1/billing/webhook/revenuecat", json={}, headers={"Authorization": ""}).status_code == 401


# ── legacy honesty ────────────────────────────────────────────────────────────

def test_legacy_ai_endpoint_does_not_fake_success_without_ai(client, monkeypatch):
    from app.services.ai import mystery_ai
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    monkeypatch.setattr(mystery_ai, "_gemini_client", None)
    monkeypatch.setattr(mystery_ai, "_openai_client", None)
    _, h = _register(client)
    r = client.post("/api/v1/cases/generate", headers=h, json=dict(
        subject="chemistry", grade_level="middle", difficulty="easy", topic="acids"))
    assert r.status_code == 503 and r.json()["code"] == "AI_UNAVAILABLE"


def test_account_deletion_removes_everything(client, player):
    play_to_evidence(player)
    r = client.delete("/api/v1/auth/me", headers=player["h"])
    assert r.status_code == 204
    assert client.get("/api/v1/auth/me", headers=player["h"]).status_code in (401, 404)
    login = client.post("/api/v1/auth/login", json=dict(email=player["user"]["email"], password="password123"))
    assert login.status_code in (401, 404)
