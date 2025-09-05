'use server'

import { getSecureAuthHeaders } from './auth'
import { BACKEND_URL } from '@/lib/config'

export async function getCommentsAction(taskId: number, skip: number = 0, limit: number = 100) {
  try {
    // 使用統一的安全認證
    const authResult = await getSecureAuthHeaders();
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error || '認證失敗'
      };
    }
    const headers = authResult.headers;
    
    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/comments/?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '獲取留言失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get comments error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '留言服務暫時無法使用',
    };
  }
}

export async function createCommentAction(taskId: number, content: string) {
  try {
    // 使用統一的安全認證
    const authResult = await getSecureAuthHeaders();
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error || '認證失敗'
      };
    }
    const headers = authResult.headers;
    
    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/comments/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '建立留言失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Create comment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '留言服務暫時無法使用',
    };
  }
}

export async function deleteCommentAction(taskId: number, commentId: number) {
  try {
    // 使用統一的安全認證
    const authResult = await getSecureAuthHeaders();
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error || '認證失敗'
      };
    }
    const headers = authResult.headers;
    
    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.detail || '刪除留言失敗',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete comment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '留言服務暫時無法使用',
    };
  }
}