#!/bin/bash

# 任務管理系統部署腳本
# 使用方式: ./scripts/deploy.sh [環境]

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函數
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查必要工具
check_dependencies() {
    print_info "檢查必要工具..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    print_info "依賴檢查完成"
}

# 環境設定
setup_environment() {
    print_info "設定環境變數..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warn ".env 檔案不存在，已從 .env.example 複製"
            print_warn "請編輯 .env 檔案並設定正確的環境變數"
        else
            print_error ".env.example 檔案不存在"
            exit 1
        fi
    fi
    
    print_info "環境設定完成"
}

# 構建和啟動服務
deploy_services() {
    print_info "開始構建和部署服務..."
    
    # 停止現有服務
    print_info "停止現有服務..."
    docker-compose down --remove-orphans
    
    # 清理舊鏡像（可選）
    if [ "$1" == "clean" ]; then
        print_info "清理舊鏡像..."
        docker-compose down --rmi all --volumes
    fi
    
    # 構建鏡像
    print_info "構建鏡像..."
    docker-compose build --no-cache
    
    # 啟動服務
    print_info "啟動服務..."
    docker-compose up -d
    
    # 等待服務啟動
    print_info "等待服務啟動..."
    sleep 10
    
    # 檢查服務狀態
    print_info "檢查服務狀態..."
    docker-compose ps
}

# 健康檢查
health_check() {
    print_info "執行健康檢查..."
    
    # 檢查後端
    print_info "檢查後端服務..."
    if curl -f -s http://localhost:8000/health > /dev/null; then
        print_info "後端服務正常"
    else
        print_error "後端服務異常"
        return 1
    fi
    
    # 檢查前端
    print_info "檢查前端服務..."
    if curl -f -s http://localhost:3000 > /dev/null; then
        print_info "前端服務正常"
    else
        print_error "前端服務異常"
        return 1
    fi
    
    print_info "所有服務運行正常！"
}

# 顯示服務信息
show_info() {
    print_info "部署完成！"
    echo ""
    echo "服務地址:"
    echo "  前端: http://localhost:3000"
    echo "  後端: http://localhost:8000"
    echo "  API文檔: http://localhost:8000/docs"
    echo "  資料庫: localhost:3306"
    echo ""
    echo "管理命令:"
    echo "  查看日誌: docker-compose logs -f"
    echo "  停止服務: docker-compose down"
    echo "  重啟服務: docker-compose restart"
    echo ""
}

# 主函數
main() {
    print_info "開始部署任務管理系統..."
    
    check_dependencies
    setup_environment
    deploy_services "$1"
    
    # 等待服務完全啟動
    print_info "等待服務完全啟動..."
    sleep 20
    
    if health_check; then
        show_info
    else
        print_error "部署失败，請檢查日誌"
        docker-compose logs
        exit 1
    fi
}

# 執行主函數
main "$@"