from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import session_dependency
from ..models import Chat, ChatKind, ChatMember, MemberRole, User
from ..schemas import GoogleLoginIn, LoginOut, UserOut
from ..security import issue_token
from ..services.google_oauth import verify_google_id_token
from ..services.turnstile import verify_turnstile_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=LoginOut)
async def login_with_google(
    payload: GoogleLoginIn,
    session: AsyncSession = Depends(session_dependency),
) -> LoginOut:
    if not await verify_turnstile_token(payload.turnstile_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bot challenge failed. Please retry the captcha.",
        )

    profile = await verify_google_id_token(payload.id_token)

    result = await session.execute(select(User).where(User.google_sub == profile.sub))
    user = result.scalar_one_or_none()
    is_new = False

    if not user:
        result_email = await session.execute(select(User).where(User.email == profile.email))
        user = result_email.scalar_one_or_none()
    if not user:
        user = User(
            google_sub=profile.sub,
            email=profile.email,
            name=profile.name,
            picture=profile.picture,
        )
        session.add(user)
        await session.flush()
        is_new = True
    else:
        user.google_sub = profile.sub
        user.name = profile.name
        if profile.picture:
            user.picture = profile.picture

    if is_new:
        saved_chat = Chat(
            kind=ChatKind.saved,
            title="Избранное",
            created_by=user.id,
        )
        session.add(saved_chat)
        await session.flush()
        session.add(
            ChatMember(
                chat_id=saved_chat.id,
                user_id=user.id,
                role=MemberRole.owner,
            )
        )

    await session.commit()
    await session.refresh(user)

    token = issue_token(user.id)
    return LoginOut(token=token, user=UserOut.model_validate(user))
