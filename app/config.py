from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Calculator Tools API"
    environment: str = "production"
    debug: bool = False
    redis_url: str | None = None
    redis_max_connections: int = 50
    database_url: str | None = None
    sentry_dsn: str | None = None
    allowed_origins: list[str] = ["*"]
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    cache_ttl_seconds: int = 3600
    log_format: str = "json"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
