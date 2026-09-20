import os

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HOME", "/tmp/hf_home")

import numpy as np
import onnxruntime as ort
from huggingface_hub import hf_hub_download
from transformers import AutoTokenizer

from core.config import settings
from core.logging import logger

ONNX_FILENAME = "onnx/model_quint8_avx2.onnx"


class OnnxSentenceEncoder:
    def __init__(self, model_name: str, cache_folder: str):
        self._tokenizer = AutoTokenizer.from_pretrained(
            model_name, cache_dir=cache_folder
        )

        onnx_path = hf_hub_download(
            repo_id=model_name,
            filename=ONNX_FILENAME,
            cache_dir=cache_folder,
        )

        self._session = ort.InferenceSession(
            onnx_path, providers=["CPUExecutionProvider"]
        )

    def encode(self, texts, convert_to_numpy: bool = True, normalize_embeddings: bool = False):
        inputs = self._tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors="np",
        )

        onnx_inputs = {
            "input_ids": inputs["input_ids"].astype(np.int64),
            "attention_mask": inputs["attention_mask"].astype(np.int64),
            "token_type_ids": inputs.get(
                "token_type_ids",
                np.zeros_like(inputs["input_ids"]),
            ).astype(np.int64),
        }

        [token_embeddings] = self._session.run(
            ["last_hidden_state"], onnx_inputs
        )

        attention_mask = onnx_inputs["attention_mask"][:, :, None].astype(np.float32)
        summed = (token_embeddings * attention_mask).sum(axis=1)
        counts = np.clip(attention_mask.sum(axis=1), a_min=1e-9, a_max=None)
        embeddings = summed / counts

        if normalize_embeddings:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / np.clip(norms, a_min=1e-9, a_max=None)

        return embeddings


class EmbeddingModelLoader:
    _model = None

    @classmethod
    def load(cls):
        if cls._model is None:
            logger.info("Loading embedding model...")

            cls._model = OnnxSentenceEncoder(
                settings.embedding_model,
                cache_folder=settings.model_cache_dir,
            )

            logger.info("Embedding model loaded.")

        return cls._model

    @classmethod
    def is_loaded(cls):
        return cls._model is not None
