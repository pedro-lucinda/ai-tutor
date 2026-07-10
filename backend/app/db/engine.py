import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


_engine = None
_session_local = None


def _get_engine():
    global _engine
    if _engine is None:
        url = os.environ["DATABASE_URL"]
        _engine = create_async_engine(url, echo=False)
    return _engine


def _get_session_local():
    global _session_local
    if _session_local is None:
        _session_local = async_sessionmaker(
            _get_engine(), expire_on_commit=False, class_=AsyncSession
        )
    return _session_local


async def get_db() -> AsyncSession:  # type: ignore[return]
    async with _get_session_local()() as session:
        yield session
