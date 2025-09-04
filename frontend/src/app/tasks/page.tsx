'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus } from '@/types';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import TaskStatsComponent from '@/components/TaskStats';
import LoginTimeDisplay from '@/components/LoginTimeDisplay';

export default function TasksPage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { 
    tasks, 
    stats, 
    loading, 
    error, 
    fetchTasks, 
    createTask, 
    updateTask, 
    deleteTask, 
    setError 
  } = useTasks();
  
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleFilterChange = (newFilter: TaskStatus | 'all') => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      fetchTasks();
    } else {
      fetchTasks(newFilter);
    }
  };

  const handleCreateTask = async (title: string, description: string) => {
    await createTask(title, description);
  };

  const handleUpdateStatus = async (id: number, status: TaskStatus) => {
    await updateTask(id, { status });
  };

  const handleEditTask = async (id: number, title: string, description: string) => {
    await updateTask(id, { title, description });
  };

  const filteredTasks = tasks;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">任務管理系統</h1>
            <div className="flex items-center space-x-4">
              <LoginTimeDisplay />
              <span className="text-gray-600 hidden sm:block">歡迎，{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 統計面板 */}
        <TaskStatsComponent stats={stats} />

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 bg-red-50/20 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-red-800">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900:text-red-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 篩選器 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50:bg-gray-700'
              }`}
            >
              全部任務 ({stats.total})
            </button>
            <button
              onClick={() => handleFilterChange('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'in_progress' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50:bg-gray-700'
              }`}
            >
              進行中 ({stats.in_progress})
            </button>
            <button
              onClick={() => handleFilterChange('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50:bg-gray-700'
              }`}
            >
              已完成 ({stats.completed})
            </button>
          </div>
        </div>

        {/* 新增任務表單 */}
        <div className="mb-8">
          <TaskForm onSubmit={handleCreateTask} loading={loading} />
        </div>

        {/* 任務列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-xl text-gray-600">載入中...</div>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdateStatus={handleUpdateStatus}
                onDelete={deleteTask}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="text-gray-500 text-lg">
              {filter === 'all' ? '尚未有任務' : `沒有${
                filter === 'in_progress' ? '進行中' : '已完成'
              }的任務`}
            </div>
            <div className="text-gray-400 text-sm mt-2">
              點擊上方的「新增任務」開始建立第一個任務
            </div>
          </div>
        )}
      </div>
    </div>
  );
}