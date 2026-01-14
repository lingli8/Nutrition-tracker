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

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true,
      },
      orderBy: { earnedAt: "desc" },
    })

    const allAchievements = await prisma.achievement.findMany({
      orderBy: [{ rarity: "asc" }, { name: "asc" }],
    })

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId))

    return NextResponse.json({
      unlocked: userAchievements,
      locked: allAchievements.filter((a) => !unlockedIds.has(a.id)),
    })
  } catch (error) {
    console.error("[v0] Error fetching achievements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
