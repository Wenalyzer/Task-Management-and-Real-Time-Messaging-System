'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus } from '@/types';
import Link from 'next/link';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: number, status: TaskStatus) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (id: number, title: string, description: string) => Promise<void>;
}

const statusColors = {
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200'
};

const statusLabels = {
  in_progress: '進行中',
  completed: '已完成'
};

export default function TaskCard({ task, onUpdateStatus, onDelete, onEdit }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [loading, setLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };

    if (showStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusMenu]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;
    
    setLoading(true);
    setShowStatusMenu(false); // 關閉選單
    try {
      await onUpdateStatus(task.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (editTitle.trim() === '') {
      return;
    }

    setLoading(true);
    try {
      await onEdit(task.id, editTitle, editDescription);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('確定要刪除此任務嗎？')) {
      setLoading(true);
      try {
        await onDelete(task.id);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                placeholder="任務標題"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="任務描述（可選）"
              />
            </div>
          ) : (
            <div>
              <Link
                href={`/tasks/${task.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {task.title}
              </Link>
              {task.description && (
                <p className="text-gray-600 mt-2 text-sm">{task.description}</p>
              )}
            </div>
          )}
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 space-y-1">
          <div>建立者: {task.creator?.email || '未知'}</div>
          <div>建立時間: {new Date(task.created_at).toLocaleDateString('zh-TW')}</div>
        </div>

        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleEdit}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  狀態 ▼
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-24">
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="block w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-900"
                    >
                      進行中
                    </button>
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="block w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-900"
                    >
                      已完成
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleEdit}
                disabled={loading}
                className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm"
              >
                編輯
              </button>
              
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                刪除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}