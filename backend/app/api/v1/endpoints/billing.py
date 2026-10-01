import hmac
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.models import User
from app.services.billing import revenuecat as rc

router = APIRouter()


@router.get("/entitlement")
async def my_entitlement(
    refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Server-verified entitlement for the signed-in user."""
    state = await rc.get_entitlement(db, current_user, force_refresh=refresh)
    return state.to_dict()


@router.post("/webhook/revenuecat")
async def revenuecat_webhook(
    request: Request,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):
    """RevenueCat -> API. Configure the same value as the Authorization header in the dashboard."""
    expected = settings.REVENUECAT_WEBHOOK_AUTH
    if not expected or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")

    body = await request.json()
    event = body.get("event") or {}
    ids = {event.get("app_user_id"), event.get("original_app_user_id")} | set(event.get("aliases") or [])
    handled = 0
    for raw in filter(None, ids):
        try:
            uid = uuid.UUID(str(raw))
        except ValueError:
            continue  # anonymous RevenueCat ids are not users
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue
        rc.invalidate(db, user.id)
        await rc.get_entitlement(db, user, force_refresh=True)
        handled += 1
    return {"ok": True, "handled": handled}
