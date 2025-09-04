'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken, getRefreshToken, authAPI, setAuthToken, setRefreshToken } from '@/lib/api';

interface TokenExpirationState {
  timeLeft: number; // 剩餘時間（秒）
}

export const useTokenExpiration = () => {
  const { logout, isAuthenticated } = useAuth();
  const [state, setState] = useState<TokenExpirationState>({
    timeLeft: 0
  });
  const [triggerCount, setTriggerCount] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastExtendRef = useRef<number>(0);

  // 解析JWT token，取得過期時間
  const parseTokenExpiration = useCallback((token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // 轉換為毫秒
    } catch {
      return null;
    }
  }, []);

  // 延長登入時間（使用refresh token）
  const extendSession = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logout();
        return;
      }

      const response = await authAPI.refresh(refreshToken);
      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      setAuthToken(access_token);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
      
      // 觸發重新監控
      setTriggerCount(prev => prev + 1);
    } catch (error) {
      console.error('延長登入時間失敗:', error);
      logout();
    }
  }, [logout]);

  // 使用者有活動時自動延長 session（限制 1 秒內最多延長一次）
  const autoExtendOnActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastExtend = now - lastExtendRef.current;
    
    if (isAuthenticated && timeSinceLastExtend > 1000) {
      lastExtendRef.current = now;
      extendSession();
    }
  }, [isAuthenticated, extendSession]);

  // 啟動 Token 監控
  const startTokenMonitoring = useCallback(() => {
    const token = getAuthToken();
    if (!token || !isAuthenticated) return;

    const expirationTime = parseTokenExpiration(token);
    if (!expirationTime) return;

    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;

    // 如果已經過期，立即登出
    if (timeUntilExpiration <= 0) {
      logout();
      return;
    }

    // 清除現有的計時器
    if (timerRef.current) clearInterval(timerRef.current);

    // 開始倒數計時
    const totalSeconds = Math.floor(timeUntilExpiration / 1000);
    startCountdown(totalSeconds);
  }, [isAuthenticated, parseTokenExpiration, logout]);

  // 開始倒數計時
  const startCountdown = useCallback((initialSeconds: number) => {
    let seconds = initialSeconds;
    
    setState({ timeLeft: seconds });
    
    timerRef.current = setInterval(() => {
      seconds -= 1;
      setState({ timeLeft: seconds });
      
      if (seconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        logout();
      }
    }, 1000);
  }, [logout]);

  // 格式化剩餘時間顯示
  const formatTimeLeft = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // 初始化和重新啟動監控
  useEffect(() => {
    if (isAuthenticated) {
      startTokenMonitoring();
    } else {
      // 清除計時器
      if (timerRef.current) clearInterval(timerRef.current);
      setState({ timeLeft: 0 });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, startTokenMonitoring]);

  // 監聽觸發器變化重新啟動監控
  useEffect(() => {
    if (isAuthenticated && triggerCount > 0) {
      startTokenMonitoring();
    }
  }, [triggerCount, isAuthenticated, startTokenMonitoring]);

  // 監聽使用者活動事件
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['click'];
    
    events.forEach(event => {
      document.addEventListener(event, autoExtendOnActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, autoExtendOnActivity);
      });
    };
  }, [isAuthenticated, autoExtendOnActivity]);

  return {
    timeLeft: state.timeLeft,
    extendSession,
    formatTimeLeft: formatTimeLeft(state.timeLeft)
  };
};