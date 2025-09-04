-- 初始化資料庫設定
-- 設定字符集和時區
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 確保資料庫存在（適應不同環境的資料庫名稱）
CREATE DATABASE IF NOT EXISTS task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS test_taskmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 用戶權限由 Docker MySQL entrypoint 自動處理
-- 無需手動授權，避免環境差異問題