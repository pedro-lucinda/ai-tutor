from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.agents import (
    make_final_test_agent,
    make_lesson_agent,
    make_progress_agent,
    make_quiz_agent,
)
from app.services import api_key_service
from app.services.errors import ApiKeyNotFoundError


class AIClientFactory:
    async def require_openai_key(self, db: AsyncSession, user_id: int) -> str:
        try:
            return await api_key_service.get_decrypted_key(db, user_id)
        except ApiKeyNotFoundError as exc:
            raise ApiKeyNotFoundError("Please add your OpenAI API key.") from exc

    def make_lesson_agent(self, api_key: str):
        return make_lesson_agent(api_key)

    def make_quiz_agent(self, api_key: str):
        return make_quiz_agent(api_key)

    def make_final_test_agent(self, api_key: str):
        return make_final_test_agent(api_key)

    def make_progress_agent(self, api_key: str):
        return make_progress_agent(api_key=api_key)


ai_client_factory = AIClientFactory()
