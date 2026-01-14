# Deployment Instructions - Next.js Version

Your nutrition tracker has been converted to a Next.js fullstack application and is ready for deployment!

## Quick Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Set up Database

#### Option A: PlanetScale MySQL (Recommended)
1. Go to [planetscale.com](https://planetscale.com)
2. Create account and new database: `nutrition-tracker`
3. Click "Connect" → Select "Prisma"
4. Copy the `DATABASE_URL`

#### Option B: Neon PostgreSQL
1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Change `prisma/schema.prisma` provider to `postgresql`
4. Copy the connection string

### Step 2: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   In Vercel dashboard, add these:
   ```
   DATABASE_URL=your_database_url_from_step1
   NEXTAUTH_SECRET=run: openssl rand -base64 32
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-app.vercel.app`

### Step 3: Initialize Database

After first deployment, run:
```bash
npx prisma db push
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
npm run db:push
```

## Your App is Live!

Access your nutrition tracker at: `https://your-app.vercel.app`

### Create First Account
1. Go to `/register`
2. Create your account
3. Log your first cycle data
4. Start tracking nutrition!

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Generate Prisma Client
npm run db:generate

# Push database schema
npm run db:push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features Available

✅ User registration and authentication
✅ Cycle phase tracking with Stacy Sims protocols
✅ Food logging with search
✅ Personalized recommendations
✅ Daily nutrition goals
✅ Streak tracking and gamification
✅ Responsive design (mobile + desktop)

## Database Management

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Push schema changes
npm run db:push

# Generate Prisma Client
npm run db:generate
```

## API Routes

All API endpoints are in `app/api/`:
- `/api/auth/*` - Authentication
- `/api/user/profile` - User management
- `/api/menstrual/*` - Cycle tracking
- `/api/nutrition/recommendations` - Smart recommendations
- `/api/logs/daily` - Food logging
- `/api/food/search` - Food database
- `/api/personalization/*` - Preference learning
- `/api/achievements` - Gamification
- `/api/stats` - User statistics

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- For PlanetScale, ensure SSL mode is correct

### Build Failures
- Run `npm run build` locally first
- Check all environment variables are set
- Ensure Prisma schema is valid

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear cookies and try again

## Next Steps

1. **Add Sample Food Data**: Create foods via API or UI
2. **Invite Users**: Share your app URL
3. **Monitor**: Use Vercel Analytics (included)
4. **Customize**: Update branding in `app/layout.tsx`

## Support

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org

Your nutrition tracker is now a production-ready SaaS application!
