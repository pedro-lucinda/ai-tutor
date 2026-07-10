from app.env import load_env

load_env()

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.courses import courses_router
from app.routes.progress import progress_router

app = FastAPI(title="AI Tutor API")

# Comma-separated list of allowed frontend origins, e.g.
# CORS_ORIGINS="https://my-frontend.onrender.com,http://localhost:5173"
_cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses_router)
app.include_router(progress_router)


@app.get("/")
def health_check():
    return {"status": "ok"}
