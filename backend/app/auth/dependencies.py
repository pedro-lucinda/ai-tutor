from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.config import AUTH0_ALGORITHMS, AUTH0_AUDIENCE, AUTH0_ISSUER, validate_auth_config
from app.auth.jwks import decode_token
from app.auth.user import CurrentUser
from app.db.engine import get_db
from app.db import repository as repo

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    validate_auth_config()

    try:
        payload = await decode_token(
            credentials.credentials,
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER,
            algorithms=AUTH0_ALGORITHMS,
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    auth0_user_id = payload.get("sub")
    if not auth0_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await repo.upsert_user_from_auth0(
        db,
        auth0_user_id=auth0_user_id,
        email=payload.get("email"),
        name=payload.get("name"),
        picture=payload.get("picture"),
    )
    await db.commit()

    return CurrentUser(
        id=user.id,
        auth0_user_id=user.auth0_user_id,
        email=user.email,
        name=user.name,
        picture=user.picture,
    )
