from pathlib import Path

from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def load_env() -> None:
    load_dotenv(_ENV_PATH)
