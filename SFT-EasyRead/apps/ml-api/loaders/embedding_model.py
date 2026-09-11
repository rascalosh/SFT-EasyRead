from sentence_transformers import SentenceTransformer

from core.config import settings
from core.logging import logger


class EmbeddingModelLoader:
    _model = None

    @classmethod
    def load(cls):
        if cls._model is None:
            logger.info("Loading embedding model...")

            cls._model = SentenceTransformer(
                settings.embedding_model,
                cache_folder=settings.model_cache_dir,
                device=settings.ml_device
            )

            logger.info("Embedding model loaded.")

        return cls._model

    @classmethod
    def is_loaded(cls):
        return cls._model is not None