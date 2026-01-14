import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateCyclePhase, calculateNutritionGoals } from "@/lib/stacy-sims-protocol"
import { RecommendationOrchestrator } from "@/lib/recommendations/recommendation-orchestrator"
import type { RecommendationContext } from "@/lib/recommendations/recommendation-strategy"
import { EdgeCaseHandler } from "@/lib/recommendations/edge-case-handler"
import { DEFICIENCY_WARNING_RATIO } from "@/lib/config/nutrition-thresholds"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userFoodPreferences: {
          where: {
            preferenceScore: { gt: 0.3 },
          },
          orderBy: { preferenceScore: "desc" },
          take: 20,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const edgeCaseHandler = new EdgeCaseHandler()
    const warnings = await edgeCaseHandler.checkAllEdgeCases(user.id)

    const cycleCheck = await edgeCaseHandler.checkCycleDataAvailability(user.id)
    if (!cycleCheck.hasData) {
      return NextResponse.json({
        recommendations: [],
        warnings,
        message: "Add your menstrual cycle data to get personalized recommendations",
      })
    }

    const latestCycle = await prisma.menstrualCycle.findFirst({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
    })

    if (!latestCycle) {
      return NextResponse.json({
        recommendations: [],
        warnings,
        message: "No cycle data found",
      })
    }

    const currentPhase = calculateCyclePhase(latestCycle.startDate, latestCycle.cycleLength, latestCycle.periodLength)

    const daysSinceStart = Math.floor((Date.now() - new Date(latestCycle.startDate).getTime()) / (1000 * 60 * 60 * 24))
    const dayInCycle = (daysSinceStart % latestCycle.cycleLength) + 1

    const goals = calculateNutritionGoals(user.weight || 65, user.activityLevel || "MODERATE", currentPhase)

    const todayLogs = await prisma.dailyLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: { food: true },
    })

    const currentNutrition = todayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.food.calories || 0) * log.servings,
        protein: acc.protein + (log.food.protein || 0) * log.servings,
        carbs: acc.carbs + (log.food.carbs || 0) * log.servings,
        fat: acc.fat + (log.food.fat || 0) * log.servings,
        iron: acc.iron + (log.food.iron || 0) * log.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, iron: 0 },
    )

    const deficientNutrients: string[] = []
    if (currentNutrition.iron < (goals.iron || 15) * DEFICIENCY_WARNING_RATIO) {
      deficientNutrients.push("iron")
    }
    if (currentNutrition.protein < goals.protein * DEFICIENCY_WARNING_RATIO) {
      deficientNutrients.push("protein")
    }

    const context: RecommendationContext = {
      user,
      cyclePhase: currentPhase,
      dayInCycle,
      currentNutrition,
      targetNutrition: goals,
      deficientNutrients,
      userPreferences: user.userFoodPreferences,
    }

    const availableFoods = await prisma.food.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    })

    const orchestrator = new RecommendationOrchestrator()
    const recommendations = await orchestrator.generateRecommendations(context, availableFoods)

    return NextResponse.json({
      goals,
      currentPhase,
      dayInCycle,
      currentNutrition,
      recommendations,
      warnings,
      personalizedCount: user.userFoodPreferences.length,
    })
  } catch (error) {
    console.error("[v0] Error generating recommendations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
