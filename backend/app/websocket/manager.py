from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """管理任務留言的WebSocket連線"""
    
    def __init__(self):
        # 按任務ID分組的WebSocket連線
        self.task_connections: Dict[int, List[WebSocket]] = {}
        # 每個WebSocket連線的使用者資訊
        self.websocket_info: Dict[WebSocket, Dict] = {}

    async def connect(self, websocket: WebSocket, task_id: int, user_id: int, user_email: str = None):
        """
        使用者加入任務的留言房間
        
        參數:
            websocket: WebSocket連線（已接受）
            task_id: 任務ID
            user_id: 使用者ID
            user_email: 使用者email（選填，用於顯示名稱）
        """
        # 建立任務房間（如果不存在）
        if task_id not in self.task_connections:
            self.task_connections[task_id] = []
        
        # 加入房間
        self.task_connections[task_id].append(websocket)
        
        # 記錄連線資訊
        self.websocket_info[websocket] = {
            "user_id": user_id,
            "task_id": task_id
        }
        
        logger.info(f"User {user_id} connected to task {task_id}")
        
        # 通知房間其他人
        display_name = user_email or f"使用者 {user_id}"
        await self.broadcast_to_task(
            task_id, 
            {
                "type": "user_joined",
                "user_id": user_id,
                "message": f"{display_name} 加入了留言"
            },
            exclude_websocket=websocket
        )

    def disconnect(self, websocket: WebSocket):
        """將使用者從任務房間移除並清理資源"""
        if websocket not in self.websocket_info:
            return
            
        info = self.websocket_info[websocket]
        task_id = info["task_id"]
        user_id = info["user_id"]
        
        # 從任務房間移除連線
        if task_id in self.task_connections:
            self.task_connections[task_id] = [
                conn for conn in self.task_connections[task_id] 
                if conn != websocket
            ]
            
            # 清理空的房間
            if not self.task_connections[task_id]:
                del self.task_connections[task_id]
        
        # 移除連線的中繼資料
        del self.websocket_info[websocket]
        
        logger.info(f"User {user_id} disconnected from task {task_id}")

    async def broadcast_to_task(self, task_id: int, message: dict, exclude_websocket: WebSocket = None):
        """
        向任務房間內的所有連線廣播訊息
        
        參數:
            task_id: 目標任務房間 ID
            message: 要廣播的訊息資料
            exclude_websocket: 要從廣播中排除的連線（選填）
        """
        if task_id not in self.task_connections:
            return
        
        # 追蹤失敗的連線以便清理
        invalid_connections = []
        
        for websocket in self.task_connections[task_id]:
            if exclude_websocket and websocket == exclude_websocket:
                continue
                
            try:
                await websocket.send_text(json.dumps(message, ensure_ascii=False, default=str))
            except Exception as e:
                logger.error(f"Error sending message to websocket: {e}")
                invalid_connections.append(websocket)
        
        # 清理失敗的連線
        for invalid_conn in invalid_connections:
            self.disconnect(invalid_conn)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """向特定的 WebSocket 連線發送訊息"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    def get_task_connection_count(self, task_id: int) -> int:
        """取得特定任務房間的連線數量"""
        if task_id not in self.task_connections:
            return 0
        return len(self.task_connections[task_id])

    def get_all_connections_count(self) -> int:
        """取得所有房間的總活躍連線數量"""
        return sum(len(connections) for connections in self.task_connections.values())

# 全域連線管理器實例
manager = ConnectionManager()