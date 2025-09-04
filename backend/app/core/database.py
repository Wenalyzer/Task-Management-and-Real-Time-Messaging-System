from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# 資料庫引擎
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={
        "init_command": f"SET time_zone = '+08:00'"
    }
)

# 會話工廠
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 模型基類
Base = declarative_base()


# 資料庫依賴
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()