# 任務管理與即時留言系統

一個基於現代化技術棧構建的全端 Web 應用程式，實現任務管理與即時協作溝通功能。

## 🌟 功能特色

### 1. 使用者註冊與登入
- **Email + 密碼認證**：支援標準 Email 格式驗證
- **密碼強度檢查**：至少 6 字元，需包含數字和字母
- **安全加密儲存**：使用 bcrypt 算法加密密碼
- **完整錯誤處理**：提供清晰的使用者反饋

### 2. 任務管理（全體共用清單）
- **任務 CRUD 操作**：建立、編輯、刪除任務
- **狀態管理**：「進行中」、「已完成」兩種狀態
- **智能篩選**：依狀態篩選任務清單
- **統計資訊**：即時顯示任務統計數據
- **全體共享**：所有使用者看到相同的任務清單

### 3. 即時留言系統
- **WebSocket 技術**：真正的即時雙向通訊
- **多人協作**：支援多個使用者同時在任務詳情頁留言
- **即時同步**：留言無需重新整理頁面即時顯示
- **使用者識別**：顯示留言者身份和時間戳記

## 🏗️ 技術架構

### 前端技術棧
- **Next.js 15.5.2**：React 19.1.0 + App Router 架構
- **TypeScript**：完整的類型安全
- **Tailwind CSS**：現代化 UI 設計
- **Server Actions**：安全的服務端操作
- **WebSocket Client**：即時通訊實現

### 後端技術棧
- **FastAPI 0.116.1**：Python Web 框架
- **SQLAlchemy 2.0.43**：Python ORM
- **MySQL 8.4.6**：關聯式資料庫
- **JWT 認證**：無狀態身份驗證
- **WebSocket**：原生即時通訊支援

### DevOps & 部署
- **Docker & Docker Compose**：容器化部署
- **GitHub Actions**：CI/CD 自動化
- **GitHub Container Registry**：映像檔分發
- **Multi-stage Build**：優化鏡像大小

## 📊 資料庫設計

本項目使用SQLAlchemy ORM定義資料模型（用Python類定義資料表結構，而非直接寫SQL）：

- **users表**: 使用者帳號 (id, email, password_hash, created_at, updated_at)
- **tasks表**: 任務項目 (id, title, description, status, created_by, created_at, updated_at) 
- **comments表**: 任務留言 (id, content, task_id, user_id, created_at)

關聯關係通過SQLAlchemy relationship管理（表與表的關係在Python代碼中定義，包含cascade刪除）。時間欄位使用timezone-aware的DateTime類型，自動處理時區。

## 🔄 前後端互動架構

### 1. **使用者認證流程**
- 瀏覽器提交登入表單 → Next.js Server Actions (`loginAction`)
- Server Actions 向後端發送 HTTP 請求 (`BACKEND_URL/auth/login`)
- 後端驗證憑證，返回 JWT access/refresh tokens
- Server Actions 將 tokens 設置為 httpOnly cookies
- 瀏覽器後續請求自動攜帶認證 cookies

### 2. **任務管理操作** 
- 瀏覽器調用 Server Actions (`getTasksAction`, `createTaskAction`等)
- Server Actions 從 cookies 取得 access token
- Server Actions 向後端發送 HTTP 請求 (Authorization: Bearer token)
- 後端驗證 JWT token，執行資料庫操作
- 結果透過 Server Actions 返回瀏覽器

### 3. **即時留言系統**
- 瀏覽器先調用 `/api/websocket-token` 獲取 WebSocket token  
- 瀏覽器直接連線到後端 WSS (`wss://domain/ws/tasks/{task_id}?token=xxx`)
- 後端驗證 token，將連線加入對應任務房間
- 訊息通過加密的 WebSocket 即時廣播給同房間的所有連線
- **注意：瀏覽器的 Request URL會顯示 token ，目前還不了解會有什麼風險**
- **Bug：重新連線後，所有已留言的時間都變成"剛剛"，不影響主要功能**

## 🚀 環境安裝與啟動

### 快速開始（推薦）

```bash
# 1. 準備文件
下載 .env.example 和 docker-compose.prod.yml 兩個文件

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env 中的必要設定

# 3. 啟動
docker compose -f docker-compose.prod.yml up -d

# 4. 訪問應用
前端：http://localhost:3000
```

## 🎯 交付項目

### 1. 可運行網址
- **前端應用**：https://task.wenalyzer.xyz/
- **後端 API**：https://task-backend.wenalyzer.xyz/
- **API 文檔**：https://task-backend.wenalyzer.xyz/docs（自動生成的文檔）

### 2. 原始碼倉庫
- **GitHub Repository**：https://github.com/Wenalyzer/Task-Management-and-Real-Time-Messaging-System
- **容器映像**：GitHub Container Registry 

### 3. 部署架構
- **前端**：Next.js standalone 模式 + Docker
- **後端**：FastAPI + Uvicorn + Docker
- **資料庫**：MySQL 8.4.6 Docker 容器

## 🔧 遇到的挑戰與解法

### 1. 密碼加密兼容性問題
**挑戰**：後端啟動時出現 `bcrypt version` 錯誤
**解法**：在 `requirements.txt` 中指定 `bcrypt==4.0.1` 特定版本

### 2. Next.js 15 參數處理變更
**挑戰**：動態路由頁面無法正確獲取 URL 參數
**解法**：採用 Next.js 15 新的 async/await 參數處理方式

### 3. 如何在不了解前端的情況下對抗AI幻覺
**挑戰**：AI會編造不存在的功能、誇大技術實現、虛構架構細節
**解法**：
- 每個技術聲明都要求AI提供具體的代碼文件位置作為證據
- 要求AI承認"不知道"而非猜測或編造
- 定期檢查文檔描述與實際代碼的一致性
- 刪除所有無法驗證的技術聲明和功能描述


## 🔒 安全性實現

- **密碼加密**：使用 bcrypt 算法
- **JWT 雙 Token**：Access Token + Refresh Token 機制
- **httpOnly Cookies**：Token 存儲在安全的 cookies 中
- **CORS 配置**：限制跨網域請求來源
- **ORM 防護**：SQLAlchemy ORM 避免 SQL 注入

---

## 🏆 專案特色

本專案實現了基本的任務管理和即時留言功能：

- ✅ **全端實現**：包含前端、後端和資料庫層
- ✅ **基本安全性**：JWT認證、密碼加密、CORS配置
- ✅ **即時功能**：WebSocket實現即時留言
- ✅ **容器化部署**：Docker Compose配置

這是一個使用現代技術棧實現的全棧Web應用。