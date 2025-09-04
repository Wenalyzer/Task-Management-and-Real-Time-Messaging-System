'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function LoginSuccessMessage() {
  const { loginMessage, clearLoginMessage } = useAuth();

  if (!loginMessage) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-green-800 text-sm font-medium">
                {loginMessage}
              </div>
            </div>
            <button
              onClick={clearLoginMessage}
              className="text-green-600 hover:text-green-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}