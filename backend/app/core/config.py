from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # 資料庫
    database_url: str = "mysql+pymysql://root:password@localhost:3306/taskmanager"
    
    # JWT - 這些應該從環境變數載入，不可硬編碼到生產環境
    secret_key: str = "your-super-secret-jwt-key-change-in-production"
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
        env_file = ".env"
        case_sensitive = False


settings = Settings()