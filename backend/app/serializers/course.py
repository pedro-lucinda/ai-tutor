"""Course JSON serializers for API responses."""

from app.db.models import Course


def serialize_course_list_item(course: Course) -> dict:
    return {
        "id": course.id,
        "topic": course.topic,
        "level": course.level,
        "status": course.status,
    }


def serialize_course_detail(course: Course) -> dict:
    return {
        "id": course.id,
        "topic": course.topic,
        "level": course.level,
        "goal": course.goal,
        "estimated_hours": course.estimated_hours,
        "status": course.status,
        "language": course.language,
        "modules": [
            {
                "id": module.id,
                "name": module.name,
                "order": module.order,
                "subtopics": [
                    {
                        "id": subtopic.id,
                        "name": subtopic.name,
                        "order": subtopic.order,
                        "unlocked": subtopic.unlocked,
                        "lesson_status": subtopic.lesson_status,
                        "quiz_status": subtopic.quiz_status,
                    }
                    for subtopic in sorted(module.subtopics, key=lambda item: item.order)
                ],
            }
            for module in sorted(course.modules, key=lambda item: item.order)
        ],
    }


def serialize_course_created(course: Course) -> dict:
    return {
        "id": course.id,
        "topic": course.topic,
        "goal": course.goal,
        "level": course.level,
        "language": course.language,
        "status": course.status,
        "modules": [
            {
                "id": module.id,
                "name": module.name,
                "order": module.order,
                "subtopics": [
                    {"id": subtopic.id, "name": subtopic.name, "order": subtopic.order}
                    for subtopic in module.subtopics
                ],
            }
            for module in course.modules
        ],
    }
