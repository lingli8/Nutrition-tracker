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
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        weight: true,
        height: true,
        activityLevel: true,
        dietaryRestrictions: true,
        allergies: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, age, weight, height, activityLevel, dietaryRestrictions, allergies } = body

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        age: age ? Number.parseInt(age) : null,
        weight: weight ? Number.parseFloat(weight) : null,
        height: height ? Number.parseFloat(height) : null,
        activityLevel,
        dietaryRestrictions,
        allergies,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[v0] Error updating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
