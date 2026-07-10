import re

from openai import APIConnectionError, APIStatusError, AuthenticationError, OpenAI, RateLimitError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import repository as repo
from app.services.encryption import decrypt, encrypt
from app.services.errors import ApiKeyNotFoundError, InvalidApiKeyFormatError

_OPENAI_KEY_PATTERN = re.compile(r"^sk-[A-Za-z0-9_-]+$")


def _validate_key_format(api_key: str) -> None:
    if not _OPENAI_KEY_PATTERN.match(api_key.strip()):
        raise InvalidApiKeyFormatError("API key must start with sk-")


async def validate_openai_key(api_key: str) -> None:
    _validate_key_format(api_key)
    client = OpenAI(api_key=api_key)
    try:
        client.models.list()
    except AuthenticationError as exc:
        raise InvalidApiKeyFormatError("Invalid OpenAI API key.") from exc
    except RateLimitError as exc:
        raise InvalidApiKeyFormatError("Your OpenAI account has reached its quota.") from exc
    except (APIConnectionError, APIStatusError) as exc:
        raise InvalidApiKeyFormatError("Could not validate OpenAI API key.") from exc


async def save_key(db: AsyncSession, user_id: int, plaintext: str) -> str:
    _validate_key_format(plaintext)
    await validate_openai_key(plaintext)
    encrypted = encrypt(plaintext.strip())
    record = await repo.upsert_user_api_key(
        db,
        user_id=user_id,
        encrypted_key=encrypted,
        key_last4=plaintext.strip()[-4:],
    )
    return record.key_last4


async def get_decrypted_key(db: AsyncSession, user_id: int) -> str:
    record = await repo.get_user_api_key(db, user_id)
    if not record:
        raise ApiKeyNotFoundError()
    return decrypt(record.encrypted_key)


async def delete_key(db: AsyncSession, user_id: int) -> bool:
    return await repo.delete_user_api_key(db, user_id)


async def get_key_status(db: AsyncSession, user_id: int) -> dict[str, str | bool | None]:
    record = await repo.get_user_api_key(db, user_id)
    if not record:
        return {"configured": False, "key_last4": None}
    return {"configured": True, "key_last4": record.key_last4}
