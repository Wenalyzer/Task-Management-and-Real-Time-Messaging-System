import { redirect } from 'next/navigation';
import { getTasksAction, getTaskStatsAction } from '@/lib/actions/tasks';
import { getCurrentUserAction, logoutAction } from '@/lib/actions/auth';
import TasksClient from '@/components/TasksClient';

export default async function TasksPage() {
  // 檢查用戶是否登入
  const userResult = await getCurrentUserAction();
  
  if (!userResult.success) {
    redirect('/login');
  }

  // 獲取任務和統計資料
  const [tasksResult, statsResult] = await Promise.all([
    getTasksAction(),
    getTaskStatsAction(),
  ]);

  if (!tasksResult.success) {
    console.error('Failed to fetch tasks:', tasksResult.error);
  }

  if (!statsResult.success) {
    console.error('Failed to fetch stats:', statsResult.error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">任務管理系統</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 hidden sm:block">
                歡迎，{userResult.data.email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  登出
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <TasksClient 
          initialTasks={tasksResult.success ? tasksResult.data : []}
          initialStats={statsResult.success ? statsResult.data : { total: 0, completed: 0, in_progress: 0, pending: 0 }}
        />
      </div>
    </div>
  );
}