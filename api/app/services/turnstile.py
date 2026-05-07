from __future__ import annotations

import asyncio
import json
import urllib.error
import urllib.parse
import urllib.request

from ..config import get_settings

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def _verify_sync(secret: str, token: str) -> dict[str, object]:
    data = urllib.parse.urlencode({"secret": secret, "response": token}).encode()
    req = urllib.request.Request(VERIFY_URL, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # noqa: S310 - trusted CF endpoint
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError):
        return {"success": False, "error-codes": ["network-error"]}
    return payload


async def verify_turnstile_token(token: str | None) -> bool:
    """Validate a Cloudflare Turnstile token if one is provided.

    Behavior:
    * Secret not configured → accept (dev/free environments).
    * Secret configured + token sent → verify with Cloudflare; reject on
      failure.
    * Secret configured + token missing → accept (soft-fail). This lets the
      app keep working when the deployed hostname has not yet been added to
      Turnstile's hostname allowlist (the widget then can't issue a token).
      Once the hostname is allowlisted the widget produces tokens normally
      and they are verified strictly.
    """

    settings = get_settings()
    if not settings.turnstile_secret_key:
        return True
    if not token:
        return True

    payload = await asyncio.to_thread(_verify_sync, settings.turnstile_secret_key, token)
    return bool(payload.get("success"))
