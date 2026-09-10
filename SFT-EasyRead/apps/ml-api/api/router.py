from fastapi import APIRouter

from api.routes import(
    health, 
    semantic
)

api_router = APIRouter()

api_router.include_router(
    health.router,
    tags=["Health"]
)

api_router.include_router(
    semantic.router,
    prefix="/semantic",
    tags=["Semantic Validation"]
)