from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import session_dependency
from ..models import Chat, ChatKind, ChatMember, MemberRole, User
from ..schemas import EmailLoginIn, EmailRegisterIn, GoogleLoginIn, LoginOut, UserOut
from ..security import hash_password, issue_token, verify_password
from ..services.google_oauth import verify_google_id_token
from ..services.turnstile import verify_turnstile_token

router = APIRouter(prefix="/auth", tags=["auth"])


async def _ensure_turnstile(token: str | None) -> None:
    if not await verify_turnstile_token(token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bot challenge failed. Please retry the captcha.",
        )


async def _seed_saved_chat(session: AsyncSession, user: User) -> None:
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


@router.post("/google", response_model=LoginOut)
async def login_with_google(
    payload: GoogleLoginIn,
    session: AsyncSession = Depends(session_dependency),
) -> LoginOut:
    await _ensure_turnstile(payload.turnstile_token)

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
        await _seed_saved_chat(session, user)

    await session.commit()
    await session.refresh(user)

    token = issue_token(user.id)
    return LoginOut(token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=LoginOut, status_code=status.HTTP_201_CREATED)
async def register_with_email(
    payload: EmailRegisterIn,
    session: AsyncSession = Depends(session_dependency),
) -> LoginOut:
    await _ensure_turnstile(payload.turnstile_token)

    email = payload.email.lower().strip()
    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Аккаунт с такой почтой уже существует",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        name=(payload.name or email.split("@")[0]).strip()[:120] or email.split("@")[0],
    )
    session.add(user)
    await session.flush()
    await _seed_saved_chat(session, user)

    await session.commit()
    await session.refresh(user)

    token = issue_token(user.id)
    return LoginOut(token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=LoginOut)
async def login_with_email(
    payload: EmailLoginIn,
    session: AsyncSession = Depends(session_dependency),
) -> LoginOut:
    await _ensure_turnstile(payload.turnstile_token)

    email = payload.email.lower().strip()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверная почта или пароль",
        )

    token = issue_token(user.id)
    return LoginOut(token=token, user=UserOut.model_validate(user))
