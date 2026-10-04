"""Application settings, loaded once from environment variables or a .env file.

pydantic-settings is the Python equivalent of reading process.env with Zod
validation on top: every field is typed, required ones fail fast at startup.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    llm_api_key: str
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"


@lru_cache
def get_settings() -> Settings:
    """Build settings on first use and cache them for the process lifetime."""
    return Settings()  # type: ignore[call-arg]  # fields come from the environment
