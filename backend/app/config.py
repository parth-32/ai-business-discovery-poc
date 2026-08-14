"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings - single source of truth for all configuration."""

    # LLM Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemma-4-26b-a4b-it"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:1b"
    DEFAULT_LLM_PROVIDER: str = "gemini"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    # Upload limits
    MAX_FILE_SIZE_MB: int = 10

    # Database
    DATABASE_URL: str = "sqlite:///./app.db"

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
