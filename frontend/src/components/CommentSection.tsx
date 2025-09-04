'use client';

import { useState, useEffect, useRef } from 'react';
import { Comment } from '@/types';
import { commentsAPI } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';

interface CommentSectionProps {
  taskId: number;
}

interface TypingUser {
  userId: number;
  userEmail: string;
}

export default function CommentSection({ taskId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('連接中...');
  const [, forceUpdate] = useState({});
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // WebSocket 連接
  const {
    isConnected,
    connectionStatus: wsStatus,
    sendComment,
    sendTypingStatus
  } = useWebSocket({
    taskId,
    onNewComment: (comment) => {
      setComments(prev => {
        // 檢查是否已存在相同 ID 的留言，避免重複
        if (prev.some(c => c.id === comment.id)) {
          return prev;
        }
        return [...prev, comment];
      });
      scrollToBottom();
    },
    onUserJoined: (userId, message) => {
      console.log(message);
    },
    onUserTyping: (userId, userEmail, isTyping) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userId);
        if (isTyping && userId !== user?.id) {
          return [...filtered, { userId, userEmail }];
        }
        return filtered;
      });
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    }
  });

  // 根據WebSocket狀態更新連接狀態
  useEffect(() => {
    switch (wsStatus) {
      case 'connecting':
        setConnectionStatus('連接中...');
        break;
      case 'connected':
        setConnectionStatus('已連接');
        break;
      case 'disconnected':
        setConnectionStatus('已斷開');
        break;
      case 'error':
        setConnectionStatus('連線錯誤');
        break;
      case 'reconnecting':
        setConnectionStatus('重新連線中...');
        break;
    }
  }, [wsStatus]);

  // 每分鐘強制更新一次以刷新時間顯示
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate({});
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 載入歷史留言
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      try {
        const response = await commentsAPI.getComments(taskId);
        setComments(response.data);
        scrollToBottom();
      } catch (err: unknown) {
        setError('載入留言失敗');
        console.error('載入留言時發生錯誤:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [taskId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!isConnected) {
      setError('連接已斷開，無法發送留言');
      return;
    }

    setSending(true);
    
    // 發送留言時立即停止打字狀態
    if (isConnected) {
      sendTypingStatus(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    const success = sendComment(newComment);
    
    if (success) {
      setNewComment('');
      setError(null);
    }
    
    setSending(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    
    // 發送打字狀態
    if (isConnected) {
      sendTypingStatus(true);
      
      // 清除之前的timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 1.5秒沒有輸入就停止打字狀態（更短更合理）
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 1500);
    }
  };

  // 處理輸入框失去焦點
  const handleInputBlur = () => {
    if (isConnected) {
      sendTypingStatus(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // 1分鐘內
      return '剛剛';
    } else if (diff < 3600000) { // 1小時內
      return `${Math.floor(diff / 60000)}分鐘前`;
    } else if (diff < 86400000) { // 1天內
      return `${Math.floor(diff / 3600000)}小時前`;
    } else {
      return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">載入留言中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 連接狀態 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            狀態: <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus}
            </span>
          </span>
          {isConnected && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">即時同步</span>
            </div>
          )}
        </div>
      </div>

      {/* 錯誤消息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50/20 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-red-800 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900:text-red-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 留言列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">還沒有留言</div>
            <div className="text-sm text-gray-500">成為第一個留言的人吧！</div>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={`comment-${comment.id}-${index}`} className="flex space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {comment.user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user?.email || '未知使用者'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(comment.created_at)}
                  </span>
                  {comment.user_id === user?.id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      我
                    </span>
                  )}
                </div>
                <div className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* 打字指示器 */}
        {typingUsers.length > 0 && (
          <div className="flex space-x-3 opacity-70">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs flex-shrink-0 animate-pulse">
              ...
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 italic">
                {typingUsers.map(u => u.userEmail).join(', ')} 正在輸入...
              </div>
            </div>
          </div>
        )}
        
        <div ref={commentsEndRef} />
      </div>

      {/* 新留言表單 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="輸入留言... (支援即時同步)"
            className="w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={!isConnected}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {newComment.length}/1000
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isConnected ? '已連接 - 留言將即時同步' : '連接中斷 - 無法發送留言'}
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || sending || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? '發送中...' : '發送留言'}
          </button>
        </div>
      </form>
    </div>
  );
}