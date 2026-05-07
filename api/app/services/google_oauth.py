from __future__ import annotations

import asyncio
from dataclasses import dataclass

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from ..config import get_settings


@dataclass(slots=True)
class GoogleProfile:
    sub: str
    email: str
    name: str
    picture: str | None


def _verify(token: str, client_id: str) -> dict[str, object]:
    request = google_requests.Request()
    return google_id_token.verify_oauth2_token(token, request, client_id)


async def verify_google_id_token(token: str) -> GoogleProfile:
    settings = get_settings()
    client_id = settings.google_client_id
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured on the server",
        )

    try:
        idinfo = await asyncio.to_thread(_verify, token, client_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google id_token: {exc}",
        ) from exc

    if not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google account email is not verified",
        )

    sub = str(idinfo.get("sub", ""))
    email = str(idinfo.get("email", ""))
    name = str(idinfo.get("name") or email.split("@")[0])
    picture_value = idinfo.get("picture")
    picture = str(picture_value) if isinstance(picture_value, str) else None
    if not sub or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google id_token did not include sub/email",
        )

    return GoogleProfile(sub=sub, email=email, name=name, picture=picture)
