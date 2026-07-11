"""Shared language helpers for agent prompts."""

from app.constants import LANGUAGE_NAMES


def language_instruction(lang: str) -> str:
    name = LANGUAGE_NAMES.get(lang, "English")
    return (
        f"\n\nIMPORTANT: Write ALL output in {name}. "
        f"Every sentence, explanation, and example must be in {name}."
    )
