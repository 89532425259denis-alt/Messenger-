from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables.

    Phase 1 of DEVO+ runs entirely on free tier infrastructure: a single
    FastAPI process, SQLite on disk, Google OAuth for sign-in and an optional
    Cloudflare Turnstile widget for bot protection.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="DEVO+")
    environment: str = Field(default="development")

    database_url: str = Field(default="sqlite+aiosqlite:///./devo_plus.db")

    google_client_id: str | None = Field(default=None)

    turnstile_site_key: str | None = Field(default=None)
    turnstile_secret_key: str | None = Field(default=None)

    jwt_secret: str = Field(default="dev-insecure-secret-change-me")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expires_minutes: int = Field(default=60 * 24 * 30)

    cors_origins: str = Field(default="*")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def data_dir() -> Path:
    """Return a writable directory for the SQLite database and uploads."""
    candidate = Path("/data")
    if candidate.exists() and candidate.is_dir():
        return candidate
    fallback = Path(__file__).resolve().parent.parent / "var"
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback
