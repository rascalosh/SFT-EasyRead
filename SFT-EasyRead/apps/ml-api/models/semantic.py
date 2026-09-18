from pydantic import BaseModel, Field

class SemanticSimilarityRequest(BaseModel):
    original: str = Field(
        ...,
        min_length=1,
        description="Original paragraph"
    )

    simplified: str = Field(
        ...,
        min_length=1,
        description="Simplified paragraph"
    )


class SemanticSimilarityResponse(BaseModel):
    similarity: float = Field(
        ...,
        ge=0,
        le=1
    )

    model: str

    processing_time_ms: int