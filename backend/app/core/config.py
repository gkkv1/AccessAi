import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ACCESS.AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Default to Localhost Postgres if not set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/accessai")
    
    # AI Keys - OpenAI (for Whisper transcription)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Azure OpenAI Configuration (for GPT models)
    AZURE_OPENAI_API_KEY: Optional[str] = os.getenv("AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT: Optional[str] = os.getenv("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-5-chat")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")
    AZURE_WHISPER_DEPLOYMENT: str = os.getenv("AZURE_WHISPER_DEPLOYMENT", "whisper")
    
    # Model Configuration
    MODEL_PROVIDER: str = os.getenv("MODEL_PROVIDER", "openai")  # openai, azure_openai, openrouter
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-3.5-turbo")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_change_me_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()

def get_settings():
    return settings
