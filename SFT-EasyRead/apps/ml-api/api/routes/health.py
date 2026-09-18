from fastapi import APIRouter
from core.config import settings

from loaders.embedding_model import EmbeddingModelLoader

router = APIRouter()



@router.get("/health")
def health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version
    }

@router.get("/models")
def models():
    return {
        "embedding_model": settings.embedding_model,
        "device": settings.ml_device,
        "loaded": EmbeddingModelLoader.is_loaded()
    }