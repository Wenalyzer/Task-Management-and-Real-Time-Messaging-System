'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, setAuthToken, setRefreshToken, removeAuthToken, getAuthToken } from '@/lib/api';

interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loginMessage: string | null;
  clearLoginMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  // 檢查使用者登入狀態
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('身份驗證檢查失敗:', error);
          removeAuthToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, refresh_token } = response.data;
      
      setAuthToken(access_token);
      if (refresh_token) {
        setRefreshToken(refresh_token);
      }
      
      // 獲取使用者資訊
      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);
      
      // 顯示登入成功訊息 - 從後端回應取得實際時間
      const expiresInMinutes = Math.floor((response.data.expires_in || 1800) / 60); // 預設30分鐘
      setLoginMessage(`登入成功！您的登入狀態將維持 ${expiresInMinutes} 分鐘`);
      setTimeout(() => setLoginMessage(null), 5000); // 5秒後自動清除
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await authAPI.register(email, password);
      // 註冊成功後自動登入
      await login(email, password);
    } catch (error) {
      console.error('註冊失敗:', error);
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setLoginMessage(null);
  };

  const clearLoginMessage = () => {
    setLoginMessage(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loginMessage,
    clearLoginMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};