from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# 使用者資訊（簡化版，用於留言中）
class CommentUser(BaseModel):
    id: int
    email: str
    
    class Config:
        from_attributes = True

# 留言建立請求
class CommentCreate(BaseModel):
    content: str

# 留言回應
class Comment(BaseModel):
    id: int
    content: str
    task_id: int
    user_id: int
    created_at: datetime = Field(..., description="ISO format UTC datetime")
    user: Optional[CommentUser] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z' if v.tzinfo is None else v.isoformat()
        }

# 留言列表回應
class CommentList(BaseModel):
    comments: list[Comment]
    total: int