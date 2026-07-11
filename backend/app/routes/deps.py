"""Shared FastAPI route dependencies and HTTP helpers."""

from typing import AsyncIterator

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.constants import SUPPORTED_LANGUAGES
from app.db import repository as repo
from app.services.errors import ApiKeyNotFoundError, InvalidApiKeyFormatError

SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


async def require_owned_course(
    db: AsyncSession,
    course_id: int,
    current_user: CurrentUser,
):
    course = await repo.get_owned_course(db, course_id, current_user.id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def resolve_lang(course_lang: str, query_lang: str | None) -> str:
    """Use query param if it's a known language, otherwise fall back to the course's language."""
    if query_lang and query_lang in SUPPORTED_LANGUAGES:
        return query_lang
    return course_lang if course_lang in SUPPORTED_LANGUAGES else "en"


def sse_stream(generator: AsyncIterator[str]) -> StreamingResponse:
    return StreamingResponse(generator, media_type="text/event-stream", headers=SSE_HEADERS)


def map_api_key_error(exc: ApiKeyNotFoundError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(exc) or "Please add your OpenAI API key.")


def map_invalid_key_error(exc: InvalidApiKeyFormatError) -> HTTPException:
    message = str(exc)
    if "quota" in message.lower():
        return HTTPException(status_code=429, detail=message)
    if "invalid" in message.lower():
        return HTTPException(status_code=401, detail=message)
    return HTTPException(status_code=400, detail=message)
