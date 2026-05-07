from __future__ import annotations

from fastapi import APIRouter

from ..config import get_settings
from ..schemas import ConfigOut

router = APIRouter(tags=["meta"])


@router.get("/config", response_model=ConfigOut)
async def public_config() -> ConfigOut:
    settings = get_settings()
    return ConfigOut(
        app_name=settings.app_name,
        google_client_id=settings.google_client_id,
        turnstile_site_key=settings.turnstile_site_key,
    )
