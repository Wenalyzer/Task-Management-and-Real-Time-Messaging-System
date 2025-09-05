'use client';

import CommentSection from '@/components/CommentSection';
import { Task } from '@/types';

interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

interface TaskDetailClientProps {
  task: Task;
  user: User;
}

export default function TaskDetailClient({ task, user }: TaskDetailClientProps) {
  const statusColors = {
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200'
  };

  const statusLabels = {
    in_progress: '進行中',
    completed: '已完成'
  };

  return (
    <>
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
            <label className="block text-gray-500 font-medium mb-1">任務ID</label>
            <div className="text-gray-900">#{task.id}</div>
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
        
        <CommentSection taskId={task.id} user={user} />
      </div>
    </>
  );
}