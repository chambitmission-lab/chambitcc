"""
Core configuration settings
Single Responsibility: 환경 설정 관리
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "참빛교회 API"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    FRONTEND_URL: str
    BACKEND_CORS_ORIGINS: List[str] = []
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Server
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.BACKEND_CORS_ORIGINS:
            self.BACKEND_CORS_ORIGINS = [self.FRONTEND_URL]


settings = Settings()
