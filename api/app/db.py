from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import data_dir, get_settings


class Base(DeclarativeBase):
    pass


def _resolve_database_url(raw: str) -> str:
    """Rewrite a relative SQLite URL to live under the writable data dir."""
    prefix = "sqlite+aiosqlite:///./"
    if raw.startswith(prefix):
        filename = raw[len(prefix):]
        return f"sqlite+aiosqlite:///{data_dir() / filename}"
    return raw


settings = get_settings()
engine = create_async_engine(_resolve_database_url(settings.database_url), future=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    from . import models  # noqa: F401  ensure models are imported

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
