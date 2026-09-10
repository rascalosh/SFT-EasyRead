from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import api_router
from core.config import settings

from contextlib import asynccontextmanager

from loaders.embedding_model import EmbeddingModelLoader


@asynccontextmanager
async def lifespan(app: FastAPI):

    EmbeddingModelLoader.load()

    yield

    # nanti Whisper / OCR cleanup di sini


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

app.include_router(
    api_router,
    prefix=settings.api_prefix,
)




@app.get("/")
def read_root():
    return {"Hello": "World"}
