from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConfigOut(BaseModel):
    app_name: str
    google_client_id: str | None
    turnstile_site_key: str | None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    picture: str | None
    username: str | None
    created_at: datetime


class GoogleLoginIn(BaseModel):
    id_token: str = Field(min_length=10)
    turnstile_token: str | None = None


class LoginOut(BaseModel):
    token: str
    user: UserOut


class ChatOut(BaseModel):
    id: str
    kind: str
    title: str
    avatar_url: str | None
    last_message_preview: str | None
    last_message_at: datetime | None
    unread_count: int
