from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from .config import get_settings


class TokenError(ValueError):
    pass


_PBKDF2_ITERATIONS = 600_000
_PBKDF2_DKLEN = 32
_PBKDF2_SALT_BYTES = 16
_PBKDF2_TAG = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    """Return a portable PBKDF2-HMAC-SHA256 hash for a plaintext password."""
    salt = secrets.token_bytes(_PBKDF2_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS, dklen=_PBKDF2_DKLEN
    )
    return "${tag}${iter}${salt}${hash}".format(
        tag=_PBKDF2_TAG,
        iter=_PBKDF2_ITERATIONS,
        salt=base64.b64encode(salt).decode("ascii").rstrip("="),
        hash=base64.b64encode(dk).decode("ascii").rstrip("="),
    )


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    parts = stored.split("$")
    if len(parts) != 5 or parts[1] != _PBKDF2_TAG:
        return False
    try:
        iterations = int(parts[2])
        salt = base64.b64decode(parts[3] + "=" * (-len(parts[3]) % 4))
        expected = base64.b64decode(parts[4] + "=" * (-len(parts[4]) % 4))
    except (ValueError, base64.binascii.Error):  # pragma: no cover - defensive
        return False
    actual = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations, dklen=len(expected)
    )
    return hmac.compare_digest(actual, expected)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def issue_token(user_id: str, *, expires_minutes: int | None = None) -> str:
    settings = get_settings()
    exp_minutes = expires_minutes or settings.jwt_expires_minutes
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=exp_minutes)).timestamp()),
    }
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(settings.jwt_secret.encode(), signing_input, hashlib.sha256).digest()
    encoded_signature = _b64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
    except ValueError as exc:
        raise TokenError("Malformed token") from exc

    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    expected = hmac.new(settings.jwt_secret.encode(), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url_decode(encoded_signature), expected):
        raise TokenError("Invalid signature")

    try:
        payload = json.loads(_b64url_decode(encoded_payload))
    except json.JSONDecodeError as exc:
        raise TokenError("Invalid payload") from exc

    exp = payload.get("exp")
    if exp is None or int(exp) < int(datetime.now(timezone.utc).timestamp()):
        raise TokenError("Token expired")

    return payload
