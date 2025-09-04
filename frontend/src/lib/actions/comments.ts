'use server'

import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://task-backend:8000';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) {
    throw new Error('未登入');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getCommentsAction(taskId: number, skip: number = 0, limit: number = 100) {
  try {
    const headers = await getAuthHeaders();
    
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
    const headers = await getAuthHeaders();
    
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
    const headers = await getAuthHeaders();
    
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