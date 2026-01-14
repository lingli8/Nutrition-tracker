import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { eventBus } from "@/lib/events/event-bus"
import type { RecommendationFeedbackEvent } from "@/lib/events/event-types"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/recommendations/feedback
 * Record user feedback on recommendations
 */
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
    const { trackingId, foodId, action, reason } = body

    // Validate action
    if (!["ACCEPTED", "REJECTED", "SAVED"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Publish feedback event
    const feedbackEvent: RecommendationFeedbackEvent = {
      eventId: crypto.randomUUID(),
      eventType: "RECOMMENDATION_FEEDBACK",
      timestamp: new Date(),
      userId: user.id,
      trackingId,
      foodId,
      action,
      reason,
    }

    await eventBus.publish(feedbackEvent)

    return NextResponse.json({ success: true, message: "Feedback recorded" })
  } catch (error) {
    console.error("[v0] Error recording feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
