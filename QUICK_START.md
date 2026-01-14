# Quick Start Guide

Welcome to your Next.js Nutrition Tracker! Here's how to get started:

## Prerequisites

- Node.js 18+ installed
- A database (PlanetScale, Neon, or MySQL)
- Git (for deployment)

## 1. Local Setup (2 minutes)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Edit .env.local and add:
# DATABASE_URL="your_database_connection_string"
# NEXTAUTH_SECRET="run: openssl rand -base64 32"
# NEXTAUTH_URL="http://localhost:3000"

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

Open http://localhost:3000

## 2. Deploy to Vercel (3 minutes)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Then on vercel.com:
# 1. Import repository
# 2. Add environment variables
# 3. Click Deploy
```

Your app will be live at: `https://your-app.vercel.app`

## 3. Create Your Account

1. Visit `/register`
2. Create account with email/password
3. Log your cycle start date
4. Start logging meals!

## Key Features

- **Smart Recommendations**: Based on your cycle phase
- **Stacy Sims Protocol**: 5-phase cycle nutrition
- **AI Personalization**: Learns your preferences
- **Gamification**: Streaks, achievements, levels
- **Analytics**: Track trends over time

## Architecture

- **Frontend**: Next.js 16 + React 19
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + MySQL/PostgreSQL
- **Auth**: NextAuth.js with JWT
- **Deployment**: Vercel (serverless)

## File Structure

```
app/
├── (auth)/              # Login/Register pages
├── (dashboard)/         # Protected app pages
├── api/                 # Backend API routes
├── layout.tsx           # Root layout
└── page.tsx             # Landing page

lib/
├── prisma.ts            # Database client
├── auth.ts              # Auth configuration
├── stacy-sims-protocol.ts # Cycle logic
└── types.ts             # TypeScript types

prisma/
└── schema.prisma        # Database schema
```

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:push      # Update database schema
npm run db:studio    # Open database GUI
npm run db:generate  # Regenerate Prisma Client
```

## Environment Variables

Required:
- `DATABASE_URL` - Your database connection string
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `NEXTAUTH_URL` - Your app URL

## Next Steps

1. Customize branding and colors in `app/globals.css`
2. Add more foods to the database
3. Invite users to test
4. Monitor with Vercel Analytics
5. Add custom domain (Vercel dashboard)

Enjoy your cycle-aware nutrition tracker!
