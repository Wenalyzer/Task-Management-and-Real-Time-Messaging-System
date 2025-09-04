'use client';

import { useTokenExpiration } from '@/hooks/useTokenExpiration';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginTimeDisplay() {
  const { isAuthenticated } = useAuth();
  const { timeLeft, formatTimeLeft, extendSession } = useTokenExpiration();

  // 只在已登入時顯示
  if (!isAuthenticated || timeLeft <= 0) {
    return null;
  }

  // 根據剩餘時間改變顏色
  const getTimeColor = () => {
    if (timeLeft <= 5 * 60) return 'text-red-600'; // 5分鐘內紅色
    if (timeLeft <= 10 * 60) return 'text-yellow-600'; // 10分鐘內黃色  
    return 'text-gray-600'; // 正常灰色
  };

  const getBackgroundColor = () => {
    if (timeLeft <= 5 * 60) return 'bg-red-50'; // 5分鐘內紅色背景
    if (timeLeft <= 10 * 60) return 'bg-yellow-50'; // 10分鐘內黃色背景
    return 'bg-gray-50'; // 正常灰色背景
  };

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBackgroundColor()}`}>
      <div className="flex items-center space-x-2">
        <svg className={`w-4 h-4 ${getTimeColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`${getTimeColor()}`}>
          {formatTimeLeft}
        </span>
        <button
          onClick={extendSession}
          className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          title="延長登入時間到30分鐘"
        >
          延長
        </button>
      </div>
    </div>
  );
}