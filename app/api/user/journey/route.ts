import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserJourneyService } from "@/lib/user-journey/journey-service"

/**
 * GET /api/user/journey
 * Get user's journey status and suggested actions
 */
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

    const journeyService = new UserJourneyService()

    const [onboardingStatus, stage, metrics, suggestedActions] = await Promise.all([
      journeyService.getOnboardingStatus(user.id),
      journeyService.getUserJourneyStage(user.id),
      journeyService.getUserMetrics(user.id),
      journeyService.getSuggestedActions(user.id),
    ])

    return NextResponse.json({
      stage,
      onboardingStatus,
      metrics,
      suggestedActions,
    })
  } catch (error) {
    console.error("[v0] Error fetching user journey:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
