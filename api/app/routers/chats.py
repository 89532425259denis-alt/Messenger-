from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_current_user, session_dependency
from ..models import Chat, ChatMember, Message, User
from ..schemas import ChatOut

router = APIRouter(prefix="/chats", tags=["chats"])


def _chat_title(chat: Chat, viewer_id: str) -> str:
    if chat.title:
        return chat.title
    if chat.kind.value == "saved":
        return "Избранное"
    other_names: list[str] = []
    for membership in chat.members:
        if membership.user_id != viewer_id and membership.user is not None:
            other_names.append(membership.user.name)
    return ", ".join(other_names) or "Без названия"


def _chat_avatar(chat: Chat, viewer_id: str) -> str | None:
    if chat.avatar_url:
        return chat.avatar_url
    for membership in chat.members:
        if membership.user_id != viewer_id and membership.user is not None:
            return membership.user.picture
    return None


@router.get("", response_model=list[ChatOut])
async def list_chats(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(session_dependency),
) -> list[ChatOut]:
    membership_stmt = (
        select(Chat)
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .where(ChatMember.user_id == user.id)
        .options(selectinload(Chat.members).selectinload(ChatMember.user))
        .order_by(desc(Chat.updated_at))
    )
    result = await session.execute(membership_stmt)
    chats = result.scalars().unique().all()

    last_message_subq = (
        select(
            Message.chat_id,
            func.max(Message.created_at).label("last_at"),
        )
        .where(Message.deleted_at.is_(None))
        .group_by(Message.chat_id)
        .subquery()
    )
    last_messages_stmt = (
        select(Message)
        .join(
            last_message_subq,
            (Message.chat_id == last_message_subq.c.chat_id)
            & (Message.created_at == last_message_subq.c.last_at),
        )
    )
    last_result = await session.execute(last_messages_stmt)
    last_by_chat: dict[str, Message] = {m.chat_id: m for m in last_result.scalars().all()}

    out: list[ChatOut] = []
    for chat in chats:
        last = last_by_chat.get(chat.id)
        out.append(
            ChatOut(
                id=chat.id,
                kind=chat.kind.value,
                title=_chat_title(chat, user.id),
                avatar_url=_chat_avatar(chat, user.id),
                last_message_preview=last.body if last else None,
                last_message_at=last.created_at if last else chat.updated_at,
                unread_count=0,
            )
        )
    return out
