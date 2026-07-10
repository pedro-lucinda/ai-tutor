from app.env import load_env

load_env()

from fastapi import FastAPI

from app.routes.courses import courses_router
from app.routes.progress import progress_router

app = FastAPI(title="AI Tutor API")

app.include_router(courses_router)
app.include_router(progress_router)


@app.get("/")
def health_check():
    return {"status": "ok"}
