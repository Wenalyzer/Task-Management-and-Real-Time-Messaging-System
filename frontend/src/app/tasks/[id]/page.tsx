import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTaskAction } from '@/lib/actions/tasks';
import { getCurrentUserAction } from '@/lib/actions/auth';
import TaskDetailClient from '@/components/TaskDetailClient';

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  // 檢查用戶是否登入
  const userResult = await getCurrentUserAction();
  
  if (!userResult.success) {
    redirect('/login');
  }

  // 獲取參數
  const resolvedParams = await params;
  const taskId = parseInt(resolvedParams.id);

  if (isNaN(taskId)) {
    redirect('/tasks');
  }

  // 獲取任務詳情
  const taskResult = await getTaskAction(taskId);

  if (!taskResult.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{taskResult.error}</div>
          <Link
            href="/tasks"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回任務列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <Link
                href="/tasks"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 返回
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">任務詳情</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <TaskDetailClient task={taskResult.data} user={userResult.data} />
      </div>
    </div>
  );
}