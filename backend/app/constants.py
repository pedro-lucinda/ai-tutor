"""Shared application constants."""

SUPPORTED_LANGUAGES = frozenset({"en", "pt-BR"})

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "pt-BR": "Portuguese (Brazil)",
}


class CourseStatus:
    BUILDING = "building"
    READY = "ready"


class ContentStatus:
    PENDING = "pending"
    GENERATED = "generated"
    VALIDATED = "validated"


class QuizType:
    SUBTOPIC = "subtopic"
    FINAL = "final"
