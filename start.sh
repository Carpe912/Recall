#!/bin/bash

# Recall Prose 编辑器 - 快速启动脚本

echo "🚀 启动 Recall Prose 编辑器..."
echo ""

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低: $(node -v)"
    echo "📌 需要 Node.js >= 18.0.0"
    echo ""
    echo "请运行以下命令切换版本："
    echo "  nvm use 18"
    echo ""
    echo "如果没有安装 Node.js 18，请先安装："
    echo "  nvm install 18"
    echo "  nvm use 18"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装"
    echo "请运行: npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm 版本: $(pnpm -v)"
echo ""

# 安装依赖
echo "📦 安装依赖..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""

# 构建 prose 包
echo "🔨 构建 Prose 编辑器..."
cd packages/prose
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

cd ../..
echo "✅ 构建完成"
echo ""

# 启动开发服务器
echo "🎉 启动开发服务器..."
echo ""
pnpm dev
