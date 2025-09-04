'use server'

import { cookies } from 'next/headers'
import { TaskStatus } from '@/types'

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

export async function getTasksAction(status?: TaskStatus) {
  try {
    const headers = await getAuthHeaders();
    const url = status 
      ? `${BACKEND_URL}/tasks/?status=${status}`
      : `${BACKEND_URL}/tasks/`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '獲取任務清單失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get tasks error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '任務服務暫時無法使用',
    };
  }
}

export async function getTaskAction(id: number) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/tasks/${id}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '獲取任務詳情失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get task error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '任務服務暫時無法使用',
    };
  }
}

export async function createTaskAction(title: string, description?: string) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/tasks/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, description }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '建立任務失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Create task error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '任務服務暫時無法使用',
    };
  }
}

export async function updateTaskAction(
  id: number, 
  updates: { title?: string; description?: string; status?: TaskStatus }
) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/tasks/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '更新任務失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Update task error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '任務服務暫時無法使用',
    };
  }
}

export async function deleteTaskAction(id: number) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.detail || '刪除任務失敗',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete task error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '任務服務暫時無法使用',
    };
  }
}

export async function getTaskStatsAction() {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/tasks/stats/overview`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || '獲取任務統計失敗',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get task stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '統計服務暫時無法使用',
    };
  }
}