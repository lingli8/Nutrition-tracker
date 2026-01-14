# 一键部署按钮

点击下方按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/nutrition-tracker&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Required%20environment%20variables&envLink=https://github.com/你的用户名/nutrition-tracker/blob/main/DEPLOY_NOW.md)

## 使用步骤

1. 点击上方按钮
2. 连接你的 GitHub 账号
3. 创建 Neon 数据库并复制连接字符串
4. 填写环境变量：
   - `DATABASE_URL`: 你的 Neon 数据库连接字符串
   - `NEXTAUTH_SECRET`: 使用 https://generate-secret.vercel.app/32 生成
   - `NEXTAUTH_URL`: 部署后填写你的 Vercel 域名
5. 点击 Deploy
6. 部署完成后更新 `NEXTAUTH_URL` 并重新部署

就这么简单！🚀
