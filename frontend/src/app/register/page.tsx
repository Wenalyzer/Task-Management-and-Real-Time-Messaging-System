'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 基本驗證 - 使用更嚴格的email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('請輸入正確的電子郵件，例如：user@gmail.com');
      setLoading(false);
      return;
    }


    // 密碼長度驗證
    if (password.length < 6) {
      setError('密碼至少6字元');
      setLoading(false);
      return;
    }

    // 密碼必須包含數字和字母
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    if (!hasNumber || !hasLetter) {
      setError('密碼需包含數字和字母');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('密碼確認不匹配');
      setLoading(false);
      return;
    }

    try {
      await register(email, password);
      router.push('/tasks');
    } catch (error: any) {
      console.error('註冊錯誤:', error);
      
      let errorMessage = '註冊失敗，請稍後再試';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // 處理Pydantic驗證錯誤
          errorMessage = detail.map(err => err.msg || err.type || '驗證失敗').join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            建立您的帳戶
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已經有帳戶了？{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              立即登入
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件 <span className="text-xs text-gray-500">（例如：user@gmail.com）</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="電子郵件"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="至少6字元，需包含數字和字母"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                確認密碼
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="再次輸入密碼"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50/20 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}