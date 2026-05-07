from __future__ import annotations

from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..models import User
from ..schemas import UserOut

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
async def read_me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
