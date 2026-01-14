import { exec } from "child_process"
import { promisify } from "util"
import * as readline from "readline"

const execAsync = promisify(exec)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function setup() {
  console.log("🚀 Nutrition Tracker Setup\n")

  // Check if .env exists
  const fs = require("fs")
  if (!fs.existsSync(".env")) {
    console.log("📝 Creating .env file...")
    const databaseUrl = await question("Enter your DATABASE_URL (or press Enter to use SQLite for testing): ")
    const nextauthSecret = await question("Enter NEXTAUTH_SECRET (or press Enter to generate): ")

    const envContent = `
DATABASE_URL="${databaseUrl || "file:./dev.db"}"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${nextauthSecret || require("crypto").randomBytes(32).toString("hex")}"
`

    fs.writeFileSync(".env", envContent.trim())
    console.log("✅ .env file created\n")
  }

  console.log("📦 Installing dependencies...")
  await execAsync("npm install")
  console.log("✅ Dependencies installed\n")

  console.log("🗄️  Setting up database...")
  await execAsync("npx prisma generate")
  await execAsync("npx prisma db push")
  console.log("✅ Database ready\n")

  console.log("🌱 Seeding database...")
  await execAsync("npx tsx lib/db-seed.ts")
  console.log("✅ Database seeded\n")

  console.log('🎉 Setup complete! Run "npm run dev" to start the app.\n')
  console.log("📱 Open http://localhost:3000 in your browser\n")
  console.log("👤 Test account: test@example.com / password123\n")

  rl.close()
}

setup().catch(console.error)
