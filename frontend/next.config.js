/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // 生產環境建議保持開啟
  output: 'standalone',
  // 禁用 turbopack 以避免 Docker 建置錯誤
  // 環境變數配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // WebSocket 支持
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig;