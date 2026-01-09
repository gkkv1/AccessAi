from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ACCESS.AI"
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_ENV: str
    PINECONE_INDEX_NAME: str = "access-ai-docs"
    
    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str = "DEV_SECRET_KEY_CHANGE_IN_PROD_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()
