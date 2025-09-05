'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BACKEND_URL } from '@/lib/config'

// 統一的認證工具函數 - 所有認證都通過安全的 API 路由
export async function getSecureAuthHeaders() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    if (!token) {
      return { success: false, error: '未登入' };
    }
    
    return { 
      success: true, 
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };
  } catch (error) {
    console.error('Get secure auth headers error:', error);
    return { success: false, error: '認證服務暫時無法使用' };
  }
}

export async function registerAction(email: string, password: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '註冊失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: '註冊服務暫時無法使用',
    };
  }
}

export async function loginAction(email: string, password: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Email 或密碼錯誤',
      };
    }

    // 設置 cookies
    const cookieStore = await cookies();
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30, // 30 minutes
    });

    if (data.refresh_token) {
      cookieStore.set('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: '登入服務暫時無法使用',
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  redirect('/login');
}

export async function getCurrentUserAction() {
  try {
    // 使用統一的安全認證架構
    const authResult = await getSecureAuthHeaders();
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error || '認證失敗'
      };
    }

    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: authResult.headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '獲取用戶資訊失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: '用戶服務暫時無法使用',
    };
  }
}

