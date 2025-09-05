import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/config'

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登入' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/auth/websocket-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || '獲取 WebSocket token 失敗' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      token: data.token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Get WebSocket token error:', error);
    return NextResponse.json(
      { success: false, error: 'WebSocket token 服務暫時無法使用' },
      { status: 500 }
    );
  }
}