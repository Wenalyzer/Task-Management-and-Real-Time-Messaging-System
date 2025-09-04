-- 初始化資料庫設定
-- 設定字符集和時區
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 確保資料庫存在
CREATE DATABASE IF NOT EXISTS task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用資料庫
USE task_management;

-- 授予用戶權限（FastAPI 會自動創建表格）
GRANT ALL PRIVILEGES ON task_management.* TO 'taskuser'@'%';
FLUSH PRIVILEGES;