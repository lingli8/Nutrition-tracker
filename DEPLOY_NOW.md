# 一键部署指南 - 5分钟上线

## 快速部署到 Vercel（推荐，完全免费）

### 步骤 1: 准备代码（1分钟）

1. 点击右上角的 **"Download ZIP"** 下载项目代码
2. 解压到本地文件夹
3. 在 GitHub 创建新仓库并上传代码：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/nutrition-tracker.git
git push -u origin main
```

### 步骤 2: 创建数据库（2分钟）

**选择 Neon（推荐）:**

1. 访问 [https://neon.tech](https://neon.tech)
2. 使用 GitHub 登录
3. 点击 "Create Project"
4. 项目名称: `nutrition-tracker`
5. 区域选择: `US East (Ohio)` 或离你最近的区域
6. 复制 **Connection String**，格式类似：
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 步骤 3: 部署到 Vercel（2分钟）

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "Add New..." → "Project"
4. 选择你刚才创建的 `nutrition-tracker` 仓库
5. 点击 "Import"
6. 在 "Environment Variables" 部分添加以下变量：

   ```
   DATABASE_URL = 粘贴你的 Neon 数据库连接字符串
   
   NEXTAUTH_SECRET = 点击下方链接生成
   https://generate-secret.vercel.app/32
   
   NEXTAUTH_URL = 先留空，部署后再填
   ```

7. 点击 "Deploy" 按钮

8. 等待 2-3 分钟部署完成

9. 部署成功后，你会看到类似这样的链接：
   ```
   https://nutrition-tracker-xxx.vercel.app
   ```

10. **重要：** 返回 Vercel 项目设置 → Environment Variables，编辑 `NEXTAUTH_URL`：
    ```
    NEXTAUTH_URL = https://你的部署链接.vercel.app
    ```

11. 点击 "Redeploy" 重新部署一次

### 步骤 4: 初始化数据库（1分钟）

部署完成后，打开终端运行：

```bash
cd 你的项目目录
npm install
npx prisma db push --skip-generate
```

或者使用 Vercel CLI：

```bash
vercel env pull .env.local
npm install
npx prisma db push
```

### 完成！🎉

现在访问你的链接：`https://nutrition-tracker-xxx.vercel.app`

你可以：
1. 点击 "Get Started" 注册账号
2. 登录后开始使用营养追踪功能
3. 体验所有功能：
   - 月经周期追踪
   - 食物记录
   - 智能营养推荐
   - 成就系统
   - 数据分析

---

## 备选方案：使用 Railway

如果 Vercel 遇到问题，可以使用 Railway：

1. 访问 [https://railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库
5. 添加 "Postgres" 数据库服务（Railway 会自动配置 DATABASE_URL）
6. 添加环境变量 NEXTAUTH_SECRET 和 NEXTAUTH_URL
7. 等待部署完成

---

## 故障排查

### 数据库连接失败
- 确保 DATABASE_URL 包含 `?sslmode=require`
- Neon: 使用 "Pooled connection" 字符串

### 登录报错
- 检查 NEXTAUTH_URL 是否正确（必须是 https:// 开头）
- 确保 NEXTAUTH_SECRET 已设置且长度足够（至少 32 字符）

### 页面空白
- 查看 Vercel Dashboard → 你的项目 → Deployments → 点击最新部署 → Functions 标签
- 查看错误日志

### 需要帮助？
查看详细文档：
- [Vercel 部署文档](https://vercel.com/docs)
- [Neon 使用指南](https://neon.tech/docs/introduction)
- [Prisma 数据库设置](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project)
