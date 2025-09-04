from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from .auth import get_current_user
from ..models import Comment as CommentModel, Task as TaskModel, User as UserModel
from ..schemas import Comment, CommentCreate, CommentList

router = APIRouter(prefix="/tasks/{task_id}/comments", tags=["comments"])

@router.get("/", response_model=List[Comment])
async def get_task_comments(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """取得任務的所有留言"""
    
    # 驗證任務是否存在
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到任務"
        )
    
    # 查詢留言（按建立時間排序）
    comments = db.query(CommentModel)\
        .filter(CommentModel.task_id == task_id)\
        .order_by(CommentModel.created_at.asc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return comments

@router.post("/", response_model=Comment)
async def create_comment(
    task_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """建立新留言（REST API，非即時）"""
    
    # 驗證任務是否存在
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到任務"
        )
    
    # 建立留言
    db_comment = CommentModel(
        content=comment.content,
        task_id=task_id,
        user_id=current_user.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return db_comment

@router.delete("/{comment_id}")
async def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """刪除留言（只能刪除自己的留言）"""
    
    # 查找留言
    comment = db.query(CommentModel)\
        .filter(CommentModel.id == comment_id, CommentModel.task_id == task_id)\
        .first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到留言"
        )
    
    # 檢查權限（只能刪除自己的留言）
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您只能刪除自己的留言"
        )
    
    # 刪除留言
    db.delete(comment)
    db.commit()
    
    return {"message": "留言刪除成功"}