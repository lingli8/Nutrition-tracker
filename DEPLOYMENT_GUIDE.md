# Nutrition Tracker - 生产部署指南

本指南提供三种部署方案，从简单到复杂，您可以根据需求选择。

---

## 方案一：Render.com（推荐 - 最简单，免费）

### 优势
- 完全免费（包括数据库和Redis）
- 零配置，自动部署
- 内置SSL证书
- 自动从Git部署

### 部署步骤

#### 1. 准备代码仓库
```bash
# 将项目上传到GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/nutrition-tracker.git
git push -u origin main
```

#### 2. 在 Render.com 部署

1. 访问 [render.com](https://render.com) 并注册账号
2. 点击 "New +" → "Blueprint"
3. 连接你的GitHub仓库
4. Render会自动检测 `render.yaml` 文件并创建以下服务：
   - MySQL 数据库
   - Redis 缓存
   - 后端 API (Java Spring Boot)
   - 前端 (React)

5. 设置环境变量（在Render控制台）：
   - `USDA_API_KEY`: 访问 [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html) 获取免费API密钥

6. 点击 "Apply" 开始部署

#### 3. 获取访问地址
部署完成后，你会得到两个URL：
- 前端: `https://nutrition-tracker-frontend.onrender.com`
- API: `https://nutrition-tracker-api.onrender.com`

**完成！** 你的应用已经在线，可以通过URL访问。

---

## 方案二：Railway.app（简单，付费）

### 优势
- 比Render更快的构建速度
- 更好的性能
- $5/月起

### 部署步骤

1. 访问 [railway.app](https://railway.app) 并注册
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway会自动创建：
   - MySQL 数据库
   - Redis
   - 后端服务
   - 前端服务

5. 设置环境变量（与Render相同）

6. 获取自定义域名或使用Railway提供的域名

---

## 方案三：Vercel + 外部数据库（前端快速，后端分离）

### 优势
- Vercel提供最快的前端CDN
- 适合前端为主的应用
- 前端免费，后端需要托管

### 部署步骤

#### 1. 部署后端到 Render/Railway（参考上面步骤）

#### 2. 部署前端到 Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 进入前端目录
cd nutrition-tracker-frontend

# 部署
vercel --prod
```

在Vercel控制台设置环境变量：
- `VITE_API_URL`: 你的后端API地址（例如：https://nutrition-tracker-api.onrender.com）

**完成！** 前端部署在 Vercel，后端在 Render/Railway。

---

## 方案四：Docker Compose + VPS（完全控制）

### 适用场景
- 需要完全控制
- 已有服务器
- 需要自定义配置

### 部署步骤

#### 1. 准备VPS服务器
- 推荐：DigitalOcean ($6/月), Linode, AWS Lightsail
- 系统：Ubuntu 22.04 LTS

#### 2. 安装Docker

```bash
# SSH到服务器
ssh root@你的服务器IP

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装Docker Compose
apt-get install docker-compose-plugin
```

#### 3. 部署应用

```bash
# 克隆代码
git clone https://github.com/你的用户名/nutrition-tracker.git
cd nutrition-tracker

# 创建环境变量文件
cat > .env << EOF
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=nutrition_tracker
MYSQL_USER=nutrition_user
MYSQL_PASSWORD=your_secure_db_password
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRATION=86400000
USDA_API_KEY=your_api_key
EOF

# 启动所有服务
docker compose -f docker-compose.production.yml up -d

# 查看日志
docker compose logs -f
```

#### 4. 设置域名和SSL

```bash
# 安装Nginx和Certbot
apt-get install nginx certbot python3-certbot-nginx

# 配置Nginx反向代理
cat > /etc/nginx/sites-available/nutrition-tracker << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/nutrition-tracker /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 获取SSL证书
certbot --nginx -d your-domain.com
```

**完成！** 访问 `https://your-domain.com`

---

## 生产环境优化清单

### 安全性
- [ ] 修改默认的JWT密钥（在生产配置中）
- [ ] 使用强密码保护数据库
- [ ] 启用HTTPS（所有方案默认支持）
- [ ] 配置CORS只允许前端域名
- [ ] 定期更新依赖包

### 性能
- [ ] 启用Redis缓存（已配置）
- [ ] 配置CDN加速静态资源
- [ ] 数据库索引优化
- [ ] 启用Gzip压缩（已配置）

### 监控
- [ ] 设置Sentry错误追踪
- [ ] 配置日志收集
- [ ] 健康检查告警

### 备份
- [ ] 数据库自动备份（Render/Railway自带）
- [ ] 定期导出用户数据

---

## 常见问题

### Q: 免费版有什么限制？
A: Render免费版：
- 数据库：1GB存储，自动休眠（15分钟无活动）
- Web服务：512MB RAM，自动休眠
- Redis：25MB内存

### Q: 如何自定义域名？
A: 
- Render: Dashboard → Settings → Custom Domain
- Vercel: Dashboard → Domains → Add
- Railway: Dashboard → Settings → Domains

### Q: 数据库迁移怎么办？
A: 使用提供的SQL脚本：
```bash
# 导出本地数据
mysqldump -u root -p nutrition_tracker > backup.sql

# 导入到生产数据库
mysql -h 生产数据库地址 -u 用户名 -p nutrition_tracker < backup.sql
```

### Q: 如何查看应用日志？
A:
- Render/Railway: 在控制台的Logs标签
- Docker: `docker compose logs -f`

---

## 下一步

部署完成后，访问你的应用URL：
1. 注册一个新账号
2. 测试所有功能
3. 设置监控和备份
4. 开始邀请用户使用！

**推荐开始方案：** 使用 Render.com 的免费层，完全够用且零成本！
