"""Application Configuration Module

Provides environment-driven configuration using Pydantic Settings.
"""

from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Holy Trial Judicial Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./holytrial.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # File uploads and evidence storage
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB limit
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [
        ".txt",
        ".md",
        ".pdf",
        ".json",
        ".csv",
    ]

    # Adversarial Reasoning Provider
    # Options: 'local_heuristic' (default offline), 'external' (NVIDIA NIM / OpenAI), 'test'
    REASONING_PROVIDER: str = "local_heuristic"
    REASONING_API_KEY: Optional[str] = None
    REASONING_MODEL_NAME: str = "meta/llama-3.1-70b-instruct"
    REASONING_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    REASONING_TIMEOUT_SECONDS: float = 30.0

    # External Evidence Ingestion
    TAVILY_API_KEY: Optional[str] = None
    HTTP_CLIENT_TIMEOUT_SECONDS: float = 10.0
    MAX_REMOTE_CONTENT_BYTES: int = 2 * 1024 * 1024  # 2 MB for fetched web content


settings = Settings()
