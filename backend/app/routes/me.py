"""User profile routes."""

from fastapi import APIRouter, Depends

from app.auth import CurrentUser, get_current_user

me_router = APIRouter(prefix="/me", tags=["me"])


@me_router.get("")
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "auth0_user_id": current_user.auth0_user_id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
    }
