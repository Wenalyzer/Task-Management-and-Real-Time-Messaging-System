from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..websocket.manager import manager
from ..core.database import get_db
from .auth import get_current_user_from_websocket
from ..models import Comment as CommentModel, User as UserModel, Task as TaskModel
from ..schemas import CommentCreate, Comment
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/tasks/{task_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    task_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket端點 - 任務留言即時通訊"""
    
    # 先接受連接，再進行認證
    await websocket.accept()
    
    # WebSocket認證 - 從query參數獲取token
    try:
        # 從query參數獲取token
        token = None
        query_params = dict(websocket.query_params)
        if "token" in query_params:
            token = query_params["token"]
        
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # 驗證使用者
        current_user = get_current_user_from_websocket(token, db)
        if not current_user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # 驗證任務是否存在
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
            return
        
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # 使用管理器的connect方法建立連線
    await manager.connect(websocket, task_id, current_user.id, current_user.email)
    
    try:
        while True:
            # 接收客戶端訊息
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                message_type = message_data.get("type")
                
                if message_type == "comment":
                    # 處理新留言
                    content = message_data.get("content", "").strip()
                    
                    if not content:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "留言內容不能為空"
                        }, ensure_ascii=False))
                        continue
                    
                    # 建立留言記錄
                    comment = CommentModel(
                        content=content,
                        task_id=task_id,
                        user_id=current_user.id
                    )
                    db.add(comment)
                    db.commit()
                    db.refresh(comment)
                    
                    # 取得完整的留言資訊（包含使用者資訊）
                    comment_with_user = db.query(CommentModel)\
                        .filter(CommentModel.id == comment.id)\
                        .first()
                    
                    # 構建廣播訊息
                    broadcast_message = {
                        "type": "new_comment",
                        "comment": {
                            "id": comment_with_user.id,
                            "content": comment_with_user.content,
                            "task_id": comment_with_user.task_id,
                            "user_id": comment_with_user.user_id,
                            "created_at": comment_with_user.created_at.isoformat(),
                            "user": {
                                "id": comment_with_user.user.id,
                                "email": comment_with_user.user.email
                            }
                        }
                    }
                    
                    # 向任務房間廣播新留言
                    await manager.broadcast_to_task(task_id, broadcast_message)
                    
                elif message_type == "typing":
                    # 處理打字狀態
                    typing_message = {
                        "type": "user_typing",
                        "user_id": current_user.id,
                        "user_email": current_user.email,
                        "is_typing": message_data.get("is_typing", False)
                    }
                    
                    await manager.broadcast_to_task(
                        task_id, 
                        typing_message, 
                        exclude_websocket=websocket
                    )
                    
                else:
                    # 未知訊息類型
                    await websocket.send_text(json.dumps({
                        "type": "error", 
                        "message": f"未知的訊息類型: {message_type}"
                    }, ensure_ascii=False))
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "無效的JSON格式"
                }, ensure_ascii=False))
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "處理訊息時發生錯誤"
                }, ensure_ascii=False))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"User {current_user.id} disconnected from task {task_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)