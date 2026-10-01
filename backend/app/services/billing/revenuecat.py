"""RevenueCat entitlement service (server side).

Entitlement model
-----------------
One entitlement, ``pro`` ("Detective Pro"), unlocked by any subscription product
attached to it in the RevenueCat dashboard (monthly + annual). The mobile app
uses the RevenueCat SDK for purchase UI and to show state immediately; THIS
module is what the API trusts when gating premium endpoints, so a modified
client can never unlock Pro.

Flow
----
1. App calls Purchases.logIn(<our user id>) so RevenueCat's app_user_id == users.id.
2. Gated endpoints call ``get_entitlement`` which reads RevenueCat's REST API
   (GET /v1/subscribers/{app_user_id}) using the SECRET key, cached for a few minutes.
3. RevenueCat webhooks invalidate the cache immediately after purchase/renewal/expiry.
4. If RevenueCat is unreachable we serve the last known state for a grace period
   (paying users are not locked out by an outage), otherwise fall back to free.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
import structlog
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Entitlement, User

logger = structlog.get_logger()


@dataclass
class EntitlementState:
    is_pro: bool
    product_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    checked_at: Optional[datetime] = None
    stale: bool = False          # served from cache because RevenueCat was unreachable
    configured: bool = True      # False when the server has no RevenueCat key

    def to_dict(self) -> dict:
        return {
            "is_pro": self.is_pro,
            "entitlement_id": settings.REVENUECAT_ENTITLEMENT_ID,
            "product_id": self.product_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "checked_at": self.checked_at.isoformat() if self.checked_at else None,
            "stale": self.stale,
            "billing_configured": self.configured,
        }


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def parse_subscriber(payload: dict) -> EntitlementState:
    """Extract the pro entitlement from a RevenueCat /subscribers response."""
    ents = (payload.get("subscriber") or {}).get("entitlements") or {}
    ent = ents.get(settings.REVENUECAT_ENTITLEMENT_ID)
    if not ent:
        return EntitlementState(is_pro=False, checked_at=_now())
    expires = _parse_dt(ent.get("expires_date"))
    active = expires is None or expires > _now()
    return EntitlementState(
        is_pro=active,
        product_id=ent.get("product_identifier"),
        expires_at=expires,
        checked_at=_now(),
    )


async def fetch_remote(app_user_id: str) -> EntitlementState:
    """Ask RevenueCat. Raises on network/HTTP failure."""
    async with httpx.AsyncClient(timeout=6.0) as client:
        resp = await client.get(
            f"{settings.REVENUECAT_API_BASE}/subscribers/{app_user_id}",
            headers={"Authorization": f"Bearer {settings.REVENUECAT_SECRET_API_KEY}"},
        )
    if resp.status_code == 404:
        return EntitlementState(is_pro=False, checked_at=_now())
    resp.raise_for_status()
    return parse_subscriber(resp.json())


def _store(db: Session, user_id, state: EntitlementState, source: str) -> None:
    row = db.query(Entitlement).filter(Entitlement.user_id == user_id).first()
    if not row:
        row = Entitlement(user_id=user_id)
        db.add(row)
    row.is_active = state.is_pro
    row.product_id = state.product_id
    row.expires_at = state.expires_at
    row.checked_at = state.checked_at or _now()
    row.source = source
    db.commit()


def _from_row(row: Entitlement, stale: bool = False) -> EntitlementState:
    active = bool(row.is_active) and (row.expires_at is None or row.expires_at > _now())
    return EntitlementState(
        is_pro=active, product_id=row.product_id, expires_at=row.expires_at,
        checked_at=row.checked_at, stale=stale,
    )


async def get_entitlement(db: Session, user: User, force_refresh: bool = False) -> EntitlementState:
    if not settings.REVENUECAT_SECRET_API_KEY:
        return EntitlementState(is_pro=False, configured=False, checked_at=_now())

    row = db.query(Entitlement).filter(Entitlement.user_id == user.id).first()
    fresh = (
        row is not None and row.checked_at is not None
        and (_now() - row.checked_at) < timedelta(seconds=settings.ENTITLEMENT_CACHE_SECONDS)
    )
    if fresh and not force_refresh:
        return _from_row(row)

    try:
        state = await fetch_remote(str(user.id))
        _store(db, user.id, state, "rest")
        return state
    except Exception as exc:
        logger.warning("revenuecat_unreachable", error=type(exc).__name__)
        if row and row.checked_at and (_now() - row.checked_at) < timedelta(
            seconds=settings.ENTITLEMENT_OFFLINE_GRACE_SECONDS
        ):
            return _from_row(row, stale=True)
        return EntitlementState(is_pro=False, stale=True, checked_at=_now())


def invalidate(db: Session, user_id) -> None:
    """Mark the cache stale so the next read re-fetches from RevenueCat."""
    row = db.query(Entitlement).filter(Entitlement.user_id == user_id).first()
    if row:
        row.checked_at = datetime(1970, 1, 1, tzinfo=timezone.utc)
        db.commit()
