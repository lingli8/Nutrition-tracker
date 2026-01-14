import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""

    const foods = await prisma.food.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(foods)
  } catch (error) {
    console.error("[v0] Error searching foods:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const food = await prisma.food.create({
      data: body,
    })

    return NextResponse.json(food)
  } catch (error) {
    console.error("[v0] Error creating food:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
