/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // 生產環境建議保持開啟
  output: 'standalone',
  // 禁用 turbopack 以避免 Docker 建置錯誤
}

module.exports = nextConfig;