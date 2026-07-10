"""User settings routes — OpenAI BYOK."""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db.engine import get_db
from app.services import api_key_service
from app.limiter import limiter
from app.services.errors import InvalidApiKeyFormatError

settings_router = APIRouter(prefix="/settings", tags=["settings"])


class OpenAIKeyRequest(BaseModel):
    api_key: str


@settings_router.get("/openai")
async def get_openai_key_status(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await api_key_service.get_key_status(db, current_user.id)


@settings_router.put("/openai")
async def save_openai_key(
    request: OpenAIKeyRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        key_last4 = await api_key_service.save_key(db, current_user.id, request.api_key)
        await db.commit()
        return {"configured": True, "key_last4": key_last4}
    except InvalidApiKeyFormatError as exc:
        message = str(exc)
        if "quota" in message.lower():
            raise HTTPException(status_code=429, detail=message) from exc
        if "invalid" in message.lower():
            raise HTTPException(status_code=401, detail=message) from exc
        raise HTTPException(status_code=400, detail=message) from exc


@settings_router.delete("/openai", status_code=204)
async def delete_openai_key(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await api_key_service.delete_key(db, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No API key configured")
    await db.commit()


@settings_router.post("/openai/validate")
@limiter.limit("5/minute")
async def validate_openai_key(
    request: Request,
    body: OpenAIKeyRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        await api_key_service.validate_openai_key(body.api_key)
        return {"valid": True}
    except InvalidApiKeyFormatError as exc:
        message = str(exc)
        if "quota" in message.lower():
            raise HTTPException(status_code=429, detail=message) from exc
        if "invalid" in message.lower():
            raise HTTPException(status_code=401, detail=message) from exc
        raise HTTPException(status_code=400, detail=message) from exc
