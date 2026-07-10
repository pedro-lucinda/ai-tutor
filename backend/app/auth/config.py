import os


def _require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN", "").strip()
AUTH0_AUDIENCE = os.environ.get("AUTH0_AUDIENCE", "").strip()
AUTH0_ISSUER = os.environ.get(
    "AUTH0_ISSUER",
    f"https://{AUTH0_DOMAIN}/" if AUTH0_DOMAIN else "",
).strip()
AUTH0_ALGORITHMS = [
    alg.strip()
    for alg in os.environ.get("AUTH0_ALGORITHMS", "RS256").split(",")
    if alg.strip()
]

JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json" if AUTH0_DOMAIN else ""


def validate_auth_config() -> None:
    _require("AUTH0_DOMAIN")
    _require("AUTH0_AUDIENCE")
