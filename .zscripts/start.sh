#!/bin/sh

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR"

# 存储所有子进程的 PID
pids=""
PORT=${PORT:-3000}
HOSTNAME=${HOSTNAME:-0.0.0.0}

# 清理函数：优雅关闭所有服务
cleanup() {
    echo ""
    echo "🛑 正在关闭所有服务..."
    
    # 发送 SIGTERM 信号给所有子进程
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            service_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo "   关闭进程 $pid ($service_name)..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    # 等待所有进程退出（最多等待 5 秒）
    sleep 1
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            # 如果还在运行，等待最多 4 秒
            timeout=4
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                timeout=$((timeout - 1))
            done
            # 如果仍然在运行，强制关闭
            if kill -0 "$pid" 2>/dev/null; then
                echo "   强制关闭进程 $pid..."
                kill -KILL "$pid" 2>/dev/null
            fi
        fi
    done
    
    echo "✅ 所有服务已关闭"
    exit 0
}

echo "🚀 开始启动所有服务..."
echo ""

# 切换到构建目录
cd "$BUILD_DIR" || exit 1

ls -lah

# 初始化数据库（如果存在）
if [ -d "./next-service-dist/db" ] && [ "$(ls -A ./next-service-dist/db 2>/dev/null)" ] && [ -d "/db" ]; then
    echo "🗄️  初始化数据库从 ./next-service-dist/db 到 /db..."
    cp -r ./next-service-dist/db/* /db/ 2>/dev/null || echo "  ⚠️  无法复制到 /db，跳过数据库初始化"
    echo "✅ 数据库初始化完成"
fi

# 启动静态站点服务（Next.js output: export）
if [ -d "./next-service-dist/out" ] || [ -d "./out" ]; then
    echo "🚀 启动静态站点服务..."
    SITE_DIR="./next-service-dist/out"
    if [ ! -d "$SITE_DIR" ]; then
        SITE_DIR="./out"
    fi

    if ! command -v python3 >/dev/null 2>&1; then
        echo "❌ 未找到 python3，无法启动静态站点服务"
        exit 1
    fi

    python3 -m http.server "$PORT" --bind "$HOSTNAME" -d "$SITE_DIR" &
    NEXT_PID=$!
    pids="$NEXT_PID"

    sleep 1
    if ! kill -0 "$NEXT_PID" 2>/dev/null; then
        echo "❌ 静态站点服务启动失败"
        exit 1
    else
        echo "✅ 静态站点服务已启动 (PID: $NEXT_PID, Port: $PORT, Dir: $SITE_DIR)"
    fi
else
    echo "❌ 未找到静态导出目录: ./next-service-dist/out 或 ./out"
    exit 1
fi

# 启动 mini-services
if [ -f "./mini-services-start.sh" ]; then
    echo "🚀 启动 mini-services..."
    
    # 运行启动脚本（从根目录运行，脚本内部会处理 mini-services-dist 目录）
    sh ./mini-services-start.sh &
    MINI_PID=$!
    pids="$pids $MINI_PID"
    
    # 等待一小段时间检查进程是否成功启动
    sleep 1
    if ! kill -0 "$MINI_PID" 2>/dev/null; then
        echo "⚠️  mini-services 可能启动失败，但继续运行..."
    else
        echo "✅ mini-services 已启动 (PID: $MINI_PID)"
    fi
elif [ -d "./mini-services-dist" ]; then
    echo "⚠️  未找到 mini-services 启动脚本，但目录存在"
else
    echo "ℹ️  mini-services 目录不存在，跳过"
fi

# 启动 Caddy（如果存在 Caddyfile）
echo "🚀 启动 Caddy..."

# Caddy 作为前台进程运行（主进程）
echo "✅ Caddy 已启动（前台运行）"
echo ""
echo "🎉 所有服务已启动！"
echo ""
echo "💡 按 Ctrl+C 停止所有服务"
echo ""

# Caddy 作为主进程运行
exec caddy run --config Caddyfile --adapter caddyfile
