from fastapi import APIRouter, Depends

from models.semantic import (
    SemanticSimilarityRequest,
    SemanticSimilarityResponse
)

from services.semantic_service import SemanticService

router = APIRouter()

@router.post("/similarity", response_model=SemanticSimilarityResponse)
def semantic_similarity(
    payload: SemanticSimilarityRequest,
    service: SemanticService = Depends()
):
    return service.similarity(payload.original, payload.simplified)
