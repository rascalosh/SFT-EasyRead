import time


from loaders.embedding_model import EmbeddingModelLoader
from core.config import settings
import numpy as np


class SemanticService:
    def __init__(self):
        self.model = EmbeddingModelLoader.load()

    def similarity(self, original: str, simplified: str):
        start = time.perf_counter()

        embeddings = self.model.encode(
            [original, simplified],
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        score = float(np.dot(embeddings[0], embeddings[1]))

        elapsed = int(
            (time.perf_counter() - start) * 1000
        )

        return {
            "similarity": round(float(score), 4),
            "model": settings.embedding_model,
            "processing_time_ms": elapsed
        }