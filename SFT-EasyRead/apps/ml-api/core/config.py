from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "EasyRead ML API"
    app_version: str = "1.0.0"

    api_prefix: str = "/api/v1"

    embedding_model: str
    model_cache_dir: str
    ml_device: str

    ml_api_token: str

    cors_origins: str

    class Config:
        env_file = ".env"
        
        
@lru_cache
def get_settings():
    return Settings()

settings = get_settings()