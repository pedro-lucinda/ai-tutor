from dataclasses import dataclass


@dataclass(frozen=True)
class CurrentUser:
    id: int
    auth0_user_id: str
    email: str | None
    name: str | None
    picture: str | None
