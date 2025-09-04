from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from ..core.database import get_db
from ..models import Task, User
from ..models.task import TaskStatus
from ..schemas import TaskCreate, TaskUpdate, Task as TaskSchema, TaskWithCreator
from .auth import get_current_user

router = APIRouter()


@router.post("/", response_model=TaskSchema)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """建立新任務"""
    db_task = Task(
        title=task.title,
        description=task.description,
        created_by=current_user.id,
        status=TaskStatus.IN_PROGRESS
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/", response_model=List[TaskWithCreator])
async def read_tasks(
    status: Optional[TaskStatus] = Query(None, description="按狀態篩選任務"),
    skip: int = Query(0, ge=0, description="跳過的項目數"),
    limit: int = Query(100, ge=1, le=100, description="返回的項目數"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取得任務列表（全體共用）"""
    query = db.query(Task).options(joinedload(Task.creator))
    
    # 按狀態篩選
    if status:
        query = query.filter(Task.status == status)
    
    # 按建立時間倒序排列
    query = query.order_by(Task.created_at.desc())
    
    tasks = query.offset(skip).limit(limit).all()
    
    # 格式化傳回資料
    result = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "created_by": task.created_by,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "creator": {
                "id": task.creator.id,
                "email": task.creator.email
            }
        }
        result.append(task_dict)
    
    return result


@router.get("/{task_id}", response_model=TaskWithCreator)
async def read_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取得單個任務詳情"""
    task = db.query(Task).options(joinedload(Task.creator)).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="找不到任務")
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "created_by": task.created_by,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "creator": {
            "id": task.creator.id,
            "email": task.creator.email
        }
    }


@router.put("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新任務"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="找不到任務")
    
    # 更新字段
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    return task


@router.get("/stats/overview")
async def get_task_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取得任務統計資訊"""
    total = db.query(Task).count()
    in_progress = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count()
    completed = db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
    
    return {
        "total": total,
        "in_progress": in_progress,
        "completed": completed
    }


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """刪除任務"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="找不到任務")
    
    db.delete(task)
    db.commit()
    return {"message": "任務刪除成功"}