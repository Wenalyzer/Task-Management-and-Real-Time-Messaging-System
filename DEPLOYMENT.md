# 🚀 生產環境部署指南

## 概述

本專案使用 GitHub Container Registry (GHCR) 來分發 Docker 映像檔，讓你可以輕鬆在任何支援 Docker 的伺服器上部署。

## 📦 映像檔

每次推送到 `main` 分支時，GitHub Actions 會自動建置並發布以下映像檔到 GHCR：

- `ghcr.io/wenkai/aa-backend:latest` - FastAPI 後端服務
- `ghcr.io/wenkai/aa-frontend:latest` - Next.js 前端應用

## 🛠️ 部署步驟

### 1. 準備伺服器環境

確保你的伺服器已安裝：
- Docker
- Docker Compose

### 2. 下載部署檔案

從 GitHub Actions artifacts 下載 `docker-compose.prod.yml`，或使用以下範例：

```yaml
services:
  mysql:
    image: mysql:8.4.6
    container_name: task-mysql
    restart: unless-stopped
    environment:
      - TZ=Asia/Taipei
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-time-zone='+08:00'
    networks:
      - task-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "$MYSQL_USER", "-p$MYSQL_PASSWORD"]
      timeout: 20s
      retries: 10
      interval: 10s
      start_period: 40s

  backend:
    image: ghcr.io/wenkai/aa-backend:latest
    container_name: task-backend
    restart: unless-stopped
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS}
      - ENVIRONMENT=production
    ports:
      - "8000:8000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - task-network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 15s
      timeout: 30s
      retries: 5
      start_period: 60s

  frontend:
    image: ghcr.io/wenkai/aa-frontend:latest
    container_name: task-frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - task-network

volumes:
  mysql_data:
    driver: local

networks:
  task-network:
    driver: bridge
```

### 3. 創建環境變數檔案

創建 `.env` 檔案並設定以下變數：

```bash
# MySQL 配置
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=task_management
MYSQL_USER=taskuser
MYSQL_PASSWORD=your_secure_password

# 後端配置
SECRET_KEY=your_64_character_secret_key_for_jwt_tokens
DATABASE_URL=mysql+pymysql://taskuser:your_secure_password@mysql:3306/task_management
BACKEND_CORS_ORIGINS=["http://your-domain.com:3000","http://localhost:3000"]
ENVIRONMENT=production

# 前端配置
NEXT_PUBLIC_API_URL=http://your-domain.com:8000
```

### 4. 登入 GitHub Container Registry (可選)

如果映像檔是私有的，需要先登入：

```bash
docker login ghcr.io -u your_github_username -p your_personal_access_token
```

### 5. 部署服務

```bash
# 拉取最新映像檔並啟動服務
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 檢查服務狀態
docker compose -f docker-compose.prod.yml ps

# 查看日誌
docker compose -f docker-compose.prod.yml logs -f
```

## 🔍 驗證部署

部署完成後，檢查以下端點：

- 前端應用：`http://your-server:3000`
- 後端 API：`http://your-server:8000`
- API 文檔：`http://your-server:8000/docs`
- 健康檢查：`http://your-server:8000/health`

## 🔄 更新部署

要更新到最新版本：

```bash
# 拉取最新映像檔
docker compose -f docker-compose.prod.yml pull

# 重啟服務
docker compose -f docker-compose.prod.yml up -d

# 清理舊映像檔
docker image prune -f
```

## 🛑 停止服務

```bash
# 停止所有服務
docker compose -f docker-compose.prod.yml down

# 停止並移除資料卷（注意：會刪除資料庫資料！）
docker compose -f docker-compose.prod.yml down -v
```

## 🔐 安全建議

1. **更改預設密碼**：確保所有密碼都是強密碼
2. **防火牆設定**：只開放必要的端口
3. **HTTPS 設定**：在生產環境使用 HTTPS
4. **定期更新**：保持 Docker 映像檔為最新版本
5. **備份資料**：定期備份 MySQL 資料庫

## 🐛 故障排除

### 常見問題

1. **容器無法啟動**
   ```bash
   docker compose -f docker-compose.prod.yml logs [service_name]
   ```

2. **資料庫連接失敗**
   - 檢查 `.env` 檔案中的資料庫配置
   - 確認 MySQL 容器已正常啟動

3. **前端無法連接後端**
   - 檢查 `NEXT_PUBLIC_API_URL` 設定
   - 確認後端容器健康檢查通過

4. **端口衝突**
   - 修改 `docker-compose.prod.yml` 中的端口映射
   - 確保宿主機端口未被佔用

### 日誌查看

```bash
# 查看所有服務日誌
docker compose -f docker-compose.prod.yml logs

# 查看特定服務日誌
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs mysql

# 即時日誌
docker compose -f docker-compose.prod.yml logs -f
```