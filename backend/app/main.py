import os
from dotenv import load_dotenv
from fastapi import FastAPI

# Ensure backend/.env is located even if server is launched from project root
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

from app.api.satellite import router as satellite_router

app = FastAPI(
    title="SatQuery AI Backend",
    description="Backend API for satellite imagery querying",
    version="0.1.0",
)

app.include_router(satellite_router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SatQuery AI backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }