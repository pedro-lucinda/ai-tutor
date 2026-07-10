import time
from typing import Any

import httpx
import jwt

from app.auth.config import JWKS_URL

_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 3600


async def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(JWKS_URL)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_fetched_at = now
        return _jwks_cache


def _get_signing_key(jwks: dict[str, Any], kid: str) -> jwt.PyJWK:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwt.PyJWK(key)
    raise jwt.InvalidTokenError("Unable to find signing key")


async def decode_token(token: str, audience: str, issuer: str, algorithms: list[str]) -> dict[str, Any]:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise jwt.InvalidTokenError("Token header missing kid")

    jwks = await _fetch_jwks()
    signing_key = _get_signing_key(jwks, kid)

    return jwt.decode(
        token,
        signing_key.key,
        algorithms=algorithms,
        audience=audience,
        issuer=issuer,
    )
