"""Application configuration loaded from environment variables."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Async SQLAlchemy URL. Defaults to a local aiosqlite DB for dev.
    # Swap to e.g. postgresql+asyncpg://user:pass@host/db for production.
    database_url: str = "sqlite+aiosqlite:///./dreamlog.db"

    # Comma-separated list of allowed CORS origins ("*" allows all).
    cors_origins: str = "*"

    app_name: str = "DreamLog API"
    api_v1_prefix: str = "/api/v1"

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return origins or ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
