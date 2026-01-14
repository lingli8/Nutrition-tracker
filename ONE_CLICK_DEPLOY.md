# 一键部署指南 (One-Click Deployment Guide)

按照以下步骤，5分钟内让你的营养追踪应用上线！

## 方案一：本地运行（最快，用于测试）

### 步骤 1: 安装依赖
```bash
npm install
```

### 步骤 2: 自动设置
```bash
npm run setup
```

这个命令会自动：
- 创建 .env 文件
- 安装所有依赖
- 设置数据库（使用本地SQLite）
- 创建测试数据

### 步骤 3: 启动应用
```bash
npm run dev
```

打开浏览器访问: **http://localhost:3000**

测试账号：
- 邮箱: `demo@nutrition.com`
- 密码: `password123`

---

## 方案二：部署到云端（获得永久链接）

### 前置准备

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录（免费）

2. **创建数据库**
   
   **选项 A: PlanetScale (推荐)**
   - 访问 https://planetscale.com
   - 创建免费账号
   - 创建新数据库: `nutrition-tracker`
   - 复制连接字符串 (DATABASE_URL)

   **选项 B: Railway (更简单)**
   - 访问 https://railway.app
   - 创建 MySQL 数据库
   - 复制连接字符串

### 部署步骤

#### 方法 1: 通过 Vercel 网站部署（推荐新手）

1. 将代码上传到 GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/nutrition-tracker.git
git push -u origin main
```

2. 在 Vercel 导入项目:
   - 登录 https://vercel.com
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - 点击 "Import"

3. 配置环境变量:
   在 Vercel 项目设置中添加:
   ```
   DATABASE_URL=你的数据库连接字符串
   NEXTAUTH_SECRET=运行命令生成: openssl rand -base64 32
   NEXTAUTH_URL=https://你的项目名.vercel.app
   ```

4. 部署完成后，初始化数据库:
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 运行数据库初始化
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

5. 访问你的应用！
   ```
   https://你的项目名.vercel.app
   ```

#### 方法 2: 使用命令行部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

按照提示设置环境变量。

---

## 环境变量说明

你需要设置以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `mysql://user:pass@host/db` |
| `NEXTAUTH_SECRET` | 认证密钥（随机生成） | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 应用访问地址 | `https://your-app.vercel.app` |

---

## 常见问题

### Q: 数据库连接失败？
A: 检查 DATABASE_URL 是否正确，确保数据库允许外部连接

### Q: 登录后无法保持登录状态？
A: 确保 NEXTAUTH_SECRET 和 NEXTAUTH_URL 已正确设置

### Q: 如何添加测试数据？
A: 运行 `npm run db:seed`

### Q: 如何查看数据库？
A: 运行 `npm run db:studio` 打开 Prisma Studio

---

## 技术支持

遇到问题？查看详细文档：
- [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- [README.md](./README.md)

---

## 下一步

应用上线后，你可以：

1. **自定义域名**: 在 Vercel 项目设置中添加自定义域名
2. **监控性能**: 查看 Vercel Analytics
3. **添加功能**: 基于现有代码继续开发
4. **邀请用户**: 分享你的应用链接！

祝你使用愉快！🎉
