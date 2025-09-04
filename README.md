# 任務管理與即時留言系統

一個使用現代化技術棧構建的任務管理系統，支援即時留言功能。

## 功能特色

- 🔐 使用者註冊與登入（JWT 認證）
- 📋 任務管理（建立、編輯、刪除、狀態切換）
- 🔍 任務狀態篩選（待處理、進行中、已完成）
- 💬 即時留言系統（WebSocket）

## 技術架構

### 前端
- **框架**: Next.js 15.5.2 (React 19.1.0)
- **樣式**: Tailwind CSS
- **狀態管理**: React Context API
- **HTTP 客戶端**: Axios
- **語言**: TypeScript

### 後端
- **框架**: FastAPI
- **資料庫**: MySQL 8.4.6
- **ORM**: SQLAlchemy
- **認證**: JWT + bcrypt
- **即時通訊**: WebSocket
- **語言**: Python 3.12

## 系統架構

```
前端 (Next.js)           後端 (FastAPI)           資料庫 (MySQL)
    |                        |                        |
    |-- HTTP API 呼叫 ------>|                        |
    |                        |-- SQLAlchemy ORM ---->|
    |<-- WebSocket 連線 -----|                        |
    |                        |                        |
```

### 前後端互動

1. **HTTP API**: 處理使用者認證、任務 CRUD 操作
2. **WebSocket**: 處理即時留言功能
3. **JWT 認證**: 保護 API 端點和 WebSocket 連線

## 資料庫設計

```sql
-- 使用者表
users:
  - id (Primary Key)
  - email (Unique)
  - password_hash (bcrypt 加密)
  - created_at, updated_at

-- 任務表
tasks:
  - id (Primary Key)
  - title (任務標題)
  - description (任務描述，可選)
  - status (enum: 'pending', 'in_progress', 'completed')
  - created_by (Foreign Key -> users.id)
  - created_at, updated_at

-- 留言表
comments:
  - id (Primary Key)
  - task_id (Foreign Key -> tasks.id)
  - user_id (Foreign Key -> users.id)
  - content (留言內容)
  - created_at
```

## 環境安裝與啟動

### 前端設置

1. 進入前端目錄並安裝依賴：
```bash
cd frontend
npm install
```

2. 啟動開發服務器：
```bash
npm run dev
```

前端將運行在 http://localhost:3000

### 後端設置

1. 進入後端目錄：
```bash
cd backend
```

2. 建立虛擬環境：
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

3. 安裝依賴：
```bash
pip install -r requirements.txt
```

4. 設置環境變數（創建 `.env` 文件）：
```env
DATABASE_URL=mysql://root:password@localhost/taskdb
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

5. 啟動後端服務：
```bash
python main.py
```

後端將運行在 http://localhost:8000

### 資料庫設置

1. 安裝 MySQL 8.4.6
2. 創建資料庫：
```sql
CREATE DATABASE taskdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 資料庫表格會在應用啟動時自動建立

## 遇到的挑戰與解法

### 1. **bcrypt 兼容性問題**
**挑戰**：啟動後端時出現 `(trapped) error reading bcrypt version` 錯誤

**解法**：在 requirements.txt 中指定特定版本 `bcrypt==4.0.1` 解決版本兼容性問題

### 2. **Next.js 15 參數處理變更**
**挑戰**：動態路由頁面無法正確獲取 URL 參數，出現警告訊息

**解法**：按照 Next.js 15 的新要求，修改參數處理方式，使用 async/await 來獲取路由參數

### 3. **WebSocket 認證流程問題**
**挑戰**：WebSocket 連線一直失敗，返回 403/400 錯誤

**解法**：調整後端 WebSocket 認證順序，先接受連線再進行身份驗證

### 4. **前端重複顯示問題**
**挑戰**：
- 同一個留言會顯示多次
- 開發模式下會建立兩個 WebSocket 連線
- 頁面出現重複元素警告

**解法**：
- 添加檢查機制避免重複顯示相同留言
- 了解到雙重連線是開發模式的正常現象
- 修正頁面元素的識別方式

## 使用說明

### 基本流程

1. **註冊帳戶**: 使用 Email 和密碼註冊
2. **登入系統**: 使用註冊的帳戶登入
3. **管理任務**: 
   - 新增任務（標題必填，描述可選）
   - 編輯任務內容
   - 切換任務狀態（待處理 → 進行中 → 已完成）
   - 刪除任務
4. **篩選任務**: 按狀態查看不同類別的任務
5. **即時留言**: 點擊任務進入詳情頁，可與其他使用者即時討論

### 驗證步驟

1. 用兩個不同的瀏覽器窗口登入不同帳戶
2. 在任務詳情頁面，一個使用者發送留言
3. 另一個使用者的頁面會立即顯示新留言（無需重新整理）