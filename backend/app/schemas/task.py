from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models.task import TaskStatus


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None


class Task(TaskBase):
    id: int
    status: TaskStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskWithCreator(Task):
    creator: dict  # 簡化的建立者資訊
    
    class Config:
        from_attributes = True