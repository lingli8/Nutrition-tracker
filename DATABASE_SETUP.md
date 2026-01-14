# Database Setup Guide

## Quick Start with PlanetScale (Recommended)

### Step 1: Create PlanetScale Account
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up for free account
3. Create new database named `nutrition-tracker`

### Step 2: Get Connection String
1. Click "Connect" on your database
2. Select "Prisma" from framework dropdown
3. Copy the DATABASE_URL

### Step 3: Configure Environment
```bash
# Create .env.local file
cp .env.example .env.local

# Add your DATABASE_URL
DATABASE_URL="mysql://xxxxx@xxxxx.us-east-3.psdb.cloud/nutrition-tracker?sslaccept=strict"

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Step 4: Push Schema
```bash
npm install
npx prisma db push
```

### Step 5: Seed Database (Optional)
```bash
npx prisma db seed
```

## Alternative: Local MySQL

```bash
# Using Docker
docker run --name nutrition-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=nutrition_tracker \
  -p 3306:3306 \
  -d mysql:8

# Update .env.local
DATABASE_URL="mysql://root:password@localhost:3306/nutrition_tracker"
```

## Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio
