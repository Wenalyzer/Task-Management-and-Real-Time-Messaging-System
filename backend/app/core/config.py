from pydantic_settings import BaseSettings
from typing import List
from pydantic import Field
import os


class Settings(BaseSettings):
    # 資料庫 - 必須從環境變數載入
    database_url: str = Field(..., description="Database connection URL")
    
    # JWT - 安全設定，secret_key 必須從環境變數載入
    secret_key: str = Field(..., min_length=32, description="JWT secret key (minimum 32 characters)")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # 跨網域資源共享
    backend_cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # 伺服器
    host: str = "0.0.0.0"
    port: int = 8000
    
    # 環境設定
    environment: str = "development"
    
    # 時區設定
    timezone: str = "Asia/Taipei"
    
    class Config:
        # 在Docker容器中，.env檔案會被複製到應用根目錄
        env_file = ".env"
        case_sensitive = False


settings = Settings()