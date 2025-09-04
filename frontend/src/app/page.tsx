'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/tasks');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            任務管理與即時留言系統
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            高效管理任務，即時協作溝通。使用現代化技術棧打造的全端應用程式。
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              立即登入
            </Link>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              註冊帳戶
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">任務管理</h3>
            <p className="text-gray-600">
              建立、編輯和追蹤任務進度。支援狀態篩選和統計分析。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V8a2 2 0 012-2h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">即時留言</h3>
            <p className="text-gray-600">
              使用 WebSocket 技術實現即時留言，多人協作無延遲。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">安全認證</h3>
            <p className="text-gray-600">
              JWT 身分驗證和 bcrypt 密碼加密，確保資料安全。
            </p>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p>使用 Next.js 15、FastAPI 和 MySQL 8.4 構建</p>
        </div>
      </div>
    </div>
  );
}