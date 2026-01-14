#!/bin/bash

echo "🚀 Nutrition Tracker - Quick Start"
echo "=================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm found: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    
    # Generate NEXTAUTH_SECRET
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -base64 32)
    else
        SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    fi
    
    cat > .env << EOF
# Database (using local SQLite for development)
DATABASE_URL="file:./dev.db"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$SECRET"
EOF
    
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push --accept-data-loss

echo ""
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo ""
echo "============================================"
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Test account:"
echo "  Email: demo@nutrition.com"
echo "  Password: password123"
echo "============================================"
