# 使用官方 Node.js 22 LTS 鏡像作為基礎
FROM node:22-alpine AS base

# 安裝依賴階段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 複製 package.json 和 package-lock.json (如果存在)
COPY package*.json ./
RUN npm ci

# 構建階段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 設置環境變數
ENV NEXT_TELEMETRY_DISABLED=1

# 構建應用
RUN npm run build

# 運行階段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 創建非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動命令
CMD ["node", "server.js"]