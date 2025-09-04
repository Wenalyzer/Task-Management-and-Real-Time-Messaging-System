'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { tasksAPI } from '@/lib/api';
import CommentSection from '@/components/CommentSection';
import LoginTimeDisplay from '@/components/LoginTimeDisplay';

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTaskId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && taskId) {
      fetchTask();
    }
  }, [isAuthenticated, authLoading, taskId]);

  const fetchTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await tasksAPI.getTask(parseInt(taskId));
      setTask(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '取得任務詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">任務不存在</div>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200'
  };

  const statusLabels = {
    in_progress: '進行中',
    completed: '已完成'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 返回
              </button>
              <h1 className="text-2xl font-bold text-gray-900">任務詳情</h1>
            </div>
            <LoginTimeDisplay />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h2>
              {task.description && (
                <p className="text-gray-600 text-lg mb-4">{task.description}</p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[task.status]} flex-shrink-0 ml-4`}>
              {statusLabels[task.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <label className="block text-gray-500 font-medium mb-1">建立者</label>
              <div className="text-gray-900">{task.creator?.email || '未知'}</div>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1">建立時間</label>
              <div className="text-gray-900">{new Date(task.created_at).toLocaleString('zh-TW')}</div>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1">更新時間</label>
              <div className="text-gray-900">{new Date(task.updated_at).toLocaleString('zh-TW')}</div>
            </div>
          </div>
        </div>

        {/* 即時留言區域 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            即時留言
          </h3>
          
          {taskId && <CommentSection taskId={parseInt(taskId)} />}
        </div>
      </div>
    </div>
  );
}