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
    """Validate a Cloudflare Turnstile token if a secret is configured.

    When the secret is not set we accept the token transparently — this lets
    the app run in dev/free environments without forcing a Cloudflare account
    while still enabling antibot protection in production.
    """

    settings = get_settings()
    if not settings.turnstile_secret_key:
        return True
    if not token:
        return False

    payload = await asyncio.to_thread(_verify_sync, settings.turnstile_secret_key, token)
    return bool(payload.get("success"))
