from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.models import Base
from app.routers import auth, tasks, comments, websocket

# 建立資料庫表格
Base.metadata.create_all(bind=engine)

# 建立 FastAPI 應用
app = FastAPI(
    title="任務管理與即時留言系統",
    description="使用 FastAPI 和 WebSocket 的任務管理系統",
    version="1.0.0"
)

# 設定 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(comments.router, tags=["comments"])
app.include_router(websocket.router, tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "任務管理與即時留言系統 API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True if settings.environment == "development" else False
    )