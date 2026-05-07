from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import SessionLocal
from ..models import ChatMember, User
from ..realtime import broker
from ..security import TokenError, decode_token

router = APIRouter()


async def _authenticate(token: str | None, session: AsyncSession) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
    except TokenError:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return await session.get(User, str(user_id))


@router.websocket("/ws/chat/{chat_id}")
async def chat_socket(websocket: WebSocket, chat_id: str) -> None:
    token = websocket.query_params.get("token")
    async with SessionLocal() as session:
        user = await _authenticate(token, session)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        membership_stmt = select(ChatMember).where(
            ChatMember.chat_id == chat_id,
            ChatMember.user_id == user.id,
        )
        result = await session.execute(membership_stmt)
        if not result.scalar_one_or_none():
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await websocket.accept()
    await broker.join(chat_id, websocket)
    await broker.broadcast(
        chat_id,
        {"type": "presence", "user_id": user.id, "name": user.name, "online": True},
    )

    try:
        while True:
            event = await websocket.receive_json()
            event_type = event.get("type")
            if event_type == "typing":
                await broker.broadcast(
                    chat_id,
                    {"type": "typing", "user_id": user.id, "name": user.name},
                )
            elif event_type == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        await broker.leave(chat_id, websocket)
        await broker.broadcast(
            chat_id,
            {"type": "presence", "user_id": user.id, "name": user.name, "online": False},
        )
