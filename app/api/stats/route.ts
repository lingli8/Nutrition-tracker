import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    })

    if (!stats) {
      // Create initial stats
      const newStats = await prisma.userStats.create({
        data: {
          userId: user.id,
        },
      })
      return NextResponse.json(newStats)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
