#!/bin/bash

echo "🚀 Nutrition Tracker 部署脚本"
echo "================================"

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 未设置"
    echo "请先设置环境变量: export DATABASE_URL='你的数据库连接'"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ 错误: NEXTAUTH_SECRET 未设置"
    echo "生成密钥: openssl rand -base64 32"
    exit 1
fi

echo "✅ 环境变量检查通过"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 生成 Prisma Client
echo ""
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 推送数据库架构
echo ""
echo "🗄️  初始化数据库..."
npx prisma db push

# 构建应用
echo ""
echo "🏗️  构建应用..."
npm run build

echo ""
echo "✨ 部署准备完成！"
echo ""
echo "本地运行: npm start"
echo "或部署到 Vercel: vercel --prod"
