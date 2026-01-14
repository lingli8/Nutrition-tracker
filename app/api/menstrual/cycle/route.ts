import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateCyclePhase } from "@/lib/stacy-sims-protocol"

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

    const cycles = await prisma.menstrualCycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
      take: 12,
    })

    return NextResponse.json(cycles)
  } catch (error) {
    console.error("[v0] Error fetching menstrual cycles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const { startDate, cycleLength, periodLength, symptoms, notes } = body

    const start = new Date(startDate)
    const currentPhase = calculateCyclePhase(start, cycleLength || 28, periodLength || 5)

    const cycle = await prisma.menstrualCycle.create({
      data: {
        userId: user.id,
        startDate: start,
        cycleLength: cycleLength || 28,
        periodLength: periodLength || 5,
        currentPhase,
        symptoms,
        notes,
      },
    })

    return NextResponse.json(cycle)
  } catch (error) {
    console.error("[v0] Error creating menstrual cycle:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
