import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
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

    const body = await req.json()
    const { foodId, accepted, recommendationType, reason, cyclePhase } = body

    // Record feedback
    await prisma.recommendationFeedback.create({
      data: {
        userId: user.id,
        foodId,
        recommendationType,
        accepted,
        reason,
        cyclePhase,
      },
    })

    // Update food preference
    const existingPref = await prisma.userFoodPreference.findUnique({
      where: {
        userId_foodId: {
          userId: user.id,
          foodId,
        },
      },
    })

    if (existingPref) {
      const newAcceptCount = accepted ? existingPref.acceptCount + 1 : existingPref.acceptCount
      const newRejectCount = accepted ? existingPref.rejectCount : existingPref.rejectCount + 1
      const totalFeedback = newAcceptCount + newRejectCount
      const acceptanceRate = totalFeedback > 0 ? newAcceptCount / totalFeedback : 0
      const recency = accepted ? 1.0 : 0.3
      const frequency = existingPref.eatCount > 0 ? Math.min(existingPref.eatCount / 10, 1) : 0

      const preferenceScore = acceptanceRate * 0.5 + recency * 0.3 + frequency * 0.2

      await prisma.userFoodPreference.update({
        where: {
          userId_foodId: {
            userId: user.id,
            foodId,
          },
        },
        data: {
          acceptCount: newAcceptCount,
          rejectCount: newRejectCount,
          preferenceScore,
          lastEatenAt: accepted ? new Date() : existingPref.lastEatenAt,
        },
      })
    } else {
      await prisma.userFoodPreference.create({
        data: {
          userId: user.id,
          foodId,
          acceptCount: accepted ? 1 : 0,
          rejectCount: accepted ? 0 : 1,
          preferenceScore: accepted ? 0.5 : 0.1,
          lastEatenAt: accepted ? new Date() : null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error recording feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
