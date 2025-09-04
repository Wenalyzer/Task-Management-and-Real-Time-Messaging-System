'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TaskStatus } from '@/types';
import { 
  getTasksAction, 
  createTaskAction, 
  updateTaskAction, 
  deleteTaskAction, 
  getTaskStatsAction 
} from '@/lib/actions/tasks';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import TaskStatsComponent from '@/components/TaskStats';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  created_by: number;
}

interface Stats {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

interface TasksClientProps {
  initialTasks: Task[];
  initialStats: Stats;
}

export default function TasksClient({ initialTasks, initialStats }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [stats, setStats] = useState(initialStats);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const refreshData = async () => {
    const [tasksResult, statsResult] = await Promise.all([
      getTasksAction(filter === 'all' ? undefined : filter),
      getTaskStatsAction(),
    ]);

    if (tasksResult.success) {
      setTasks(tasksResult.data);
    }

    if (statsResult.success) {
      setStats(statsResult.data);
    }
  };

  const handleFilterChange = (newFilter: TaskStatus | 'all') => {
    setFilter(newFilter);
    setError(null);
    
    startTransition(async () => {
      const result = await getTasksAction(newFilter === 'all' ? undefined : newFilter);
      
      if (result.success) {
        setTasks(result.data);
      } else {
        setError(result.error);
      }
    });
  };

  const handleCreateTask = async (title: string, description: string) => {
    setError(null);
    
    startTransition(async () => {
      const result = await createTaskAction(title, description);
      
      if (result.success) {
        await refreshData();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleUpdateStatus = async (id: number, status: TaskStatus) => {
    setError(null);
    
    startTransition(async () => {
      const result = await updateTaskAction(id, { status });
      
      if (result.success) {
        await refreshData();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleEditTask = async (id: number, title: string, description: string) => {
    setError(null);
    
    startTransition(async () => {
      const result = await updateTaskAction(id, { title, description });
      
      if (result.success) {
        await refreshData();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleDeleteTask = async (id: number) => {
    setError(null);
    
    startTransition(async () => {
      const result = await deleteTaskAction(id);
      
      if (result.success) {
        await refreshData();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const filteredTasks = tasks;

  return (
    <>
      {/* 統計面板 */}
      <TaskStatsComponent stats={stats} />

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-6 bg-red-50/20 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900"
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
            disabled={isPending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部任務 ({stats.total})
          </button>
          <button
            onClick={() => handleFilterChange('in_progress')}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              filter === 'in_progress' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            進行中 ({stats.in_progress})
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              filter === 'completed' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            已完成 ({stats.completed})
          </button>
        </div>
      </div>

      {/* 新增任務表單 */}
      <div className="mb-8">
        <TaskForm onSubmit={handleCreateTask} loading={isPending} />
      </div>

      {/* 任務列表 */}
      {isPending && tasks.length === 0 ? (
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
              onDelete={handleDeleteTask}
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
    </>
  );
}