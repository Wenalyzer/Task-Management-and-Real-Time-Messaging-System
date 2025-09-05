import { NextResponse } from 'next/server';

export async function GET() {
  // 從環境變數讀取 WebSocket URL，支援靈活配置
  const wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:8000';
  
  return NextResponse.json({
    success: true,
    websocketUrl: wsUrl
  });
}