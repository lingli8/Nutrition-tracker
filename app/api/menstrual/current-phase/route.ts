import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateCyclePhase, STACY_SIMS_PROTOCOLS } from "@/lib/stacy-sims-protocol"

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

    const latestCycle = await prisma.menstrualCycle.findFirst({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
    })

    if (!latestCycle) {
      return NextResponse.json({ error: "No cycle data found" }, { status: 404 })
    }

    const currentPhase = calculateCyclePhase(latestCycle.startDate, latestCycle.cycleLength, latestCycle.periodLength)
    const protocol = STACY_SIMS_PROTOCOLS[currentPhase]

    return NextResponse.json({
      phase: currentPhase,
      cycle: latestCycle,
      recommendations: protocol,
    })
  } catch (error) {
    console.error("[v0] Error fetching current phase:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
