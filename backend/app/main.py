from app.env import load_env

load_env()

import logging
import os
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.limiter import limiter

from app.routes.courses import courses_router
from app.routes.me import me_router
from app.routes.progress import progress_router
from app.routes.settings import settings_router

logger = logging.getLogger("ai_tutor")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Tutor API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


_cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip() and origin.strip() != "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    response = await call_next(request)
    user_id = getattr(request.state, "user_id", None)
    logger.info(
        "request_id=%s method=%s path=%s status=%s user_id=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        user_id,
    )
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(me_router)
app.include_router(settings_router)
app.include_router(courses_router)
app.include_router(progress_router)


@app.get("/")
def health_check():
    return {"status": "ok"}
