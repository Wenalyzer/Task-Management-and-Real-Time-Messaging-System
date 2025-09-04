'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Comment, WebSocketMessage } from '@/types';
import { getAuthToken } from '@/lib/api';

/**
 * WebSocket hook 配置介面
 */
interface UseWebSocketProps {
  taskId: number;
  onNewComment: (comment: Comment) => void;
  onUserJoined?: (userId: number, message: string) => void;
  onUserTyping?: (userId: number, userEmail: string, isTyping: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * 用於管理任務留言 WebSocket 連線的自定義 hook
 * 
 * @param props - WebSocket 配置
 * @returns WebSocket 連線狀態和控制函數
 */
export const useWebSocket = ({
  taskId,
  onNewComment,
  onUserJoined,
  onUserTyping,
  onError
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    // 防止重複連線
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return;
    }
    
    // 如果正在連線中，也不要重複連線
    if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      onError?.('未找到認證令牌');
      return;
    }

    try {
      setConnectionStatus('connecting');
      const wsUrl = `ws://localhost:8000/ws/tasks/${taskId}?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket 已連接至任務', taskId);
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'new_comment':
              if (message.comment) {
                onNewComment(message.comment);
              }
              break;
              
            case 'user_joined':
              if (message.user_id && message.message) {
                onUserJoined?.(message.user_id, message.message);
              }
              break;
              
            case 'user_typing':
              if (message.user_id && message.user_email !== undefined && message.is_typing !== undefined) {
                onUserTyping?.(message.user_id, message.user_email, message.is_typing);
              }
              break;
              
            case 'error':
              onError?.(message.message || '未知錯誤');
              break;
              
            default:
              console.warn('未知的訊息類型:', message.type);
          }
        } catch (error) {
          console.error('解析 WebSocket 訊息時發生錯誤:', error);
          onError?.('解析訊息時發生錯誤');
        }
      };

      ws.current.onclose = (event) => {
        console.log(`WebSocket關閉，代碼: ${event.code}, 原因: ${event.reason}`);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // 如果不是正常關閉，嘗試自動重連
        if (event.code !== 1000 && reconnectAttemptsRef.current < 5) {
          setConnectionStatus('reconnecting');
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // 指數退避，最多30秒
          console.log(`WebSocket 將在 ${delay}ms 後嘗試重連 (第${reconnectAttemptsRef.current + 1}次)`);
          
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (reconnectAttemptsRef.current <= 5) {
              connect();
            }
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket 錯誤:', error);
        setConnectionStatus('error');
        onError?.('WebSocket連線發生錯誤');
      };

    } catch (error) {
      console.error('建立 WebSocket 連線失敗:', error);
      setConnectionStatus('error');
      onError?.('建立WebSocket連線失敗');
    }
  }, [taskId, onNewComment, onUserJoined, onUserTyping, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close(1000, '使用者主動斷線');
    }
    
    ws.current = null;
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendComment = useCallback((content: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'comment',
        content: content.trim()
      };
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      onError?.('連接已斷開，無法發送留言');
      return false;
    }
  }, [onError]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'typing',
        is_typing: isTyping
      };
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const connectIfMounted = async () => {
      if (mounted && taskId) {
        connect();
      }
    };
    
    connectIfMounted();

    return () => {
      mounted = false;
      disconnect();
    };
  }, [taskId]); // 只依賴 taskId，避免無限重新連線

  return {
    isConnected,
    connectionStatus,
    sendComment,
    sendTypingStatus,
    reconnect: connect,
    disconnect
  };
};