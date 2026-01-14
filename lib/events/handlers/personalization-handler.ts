import { prisma } from "@/lib/prisma"
import type { FoodLoggedEvent, RecommendationFeedbackEvent } from "../event-types"

/**
 * Personalization Event Handlers
 * Update user preferences based on their actions
 */

/**
 * Handle food logged - update preference score
 */
export async function handleFoodLogged(event: FoodLoggedEvent): Promise<void> {
  console.log(`[v0] PersonalizationHandler: Processing food logged for user ${event.userId}`)

  try {
    // Find or create user food preference
    const existingPref = await prisma.userFoodPreference.findUnique({
      where: {
        userId_foodId: {
          userId: event.userId,
          foodId: event.foodId,
        },
      },
    })

    if (existingPref) {
      // Update existing preference
      const newEatCount = existingPref.eatCount + 1
      const newPreferenceScore = Math.min(existingPref.preferenceScore + 0.1, 1.0)

      await prisma.userFoodPreference.update({
        where: {
          userId_foodId: {
            userId: event.userId,
            foodId: event.foodId,
          },
        },
        data: {
          eatCount: newEatCount,
          lastEaten: new Date(),
          preferenceScore: newPreferenceScore,
        },
      })
    } else {
      // Create new preference
      await prisma.userFoodPreference.create({
        data: {
          userId: event.userId,
          foodId: event.foodId,
          preferenceScore: 0.5, // Start neutral
          eatCount: 1,
          acceptanceRate: 1.0, // 100% since they ate it
          lastEaten: new Date(),
        },
      })
    }

    console.log(`[v0] PersonalizationHandler: Updated preference for food ${event.foodId}`)
  } catch (error) {
    console.error("[v0] PersonalizationHandler: Error updating preference:", error)
  }
}

/**
 * Handle recommendation feedback - learn from user choices
 */
export async function handleRecommendationFeedback(event: RecommendationFeedbackEvent): Promise<void> {
  console.log(`[v0] PersonalizationHandler: Processing feedback for ${event.trackingId}`)

  try {
    // Record feedback
    await prisma.recommendationFeedback.create({
      data: {
        userId: event.userId,
        foodId: event.foodId,
        trackingId: event.trackingId,
        action: event.action,
        reason: event.reason,
        timestamp: new Date(),
      },
    })

    // Update user food preference based on feedback
    const existingPref = await prisma.userFoodPreference.findUnique({
      where: {
        userId_foodId: {
          userId: event.userId,
          foodId: event.foodId,
        },
      },
    })

    if (existingPref) {
      // Adjust acceptance rate
      const totalRecommendations = existingPref.recommendCount + 1
      let acceptedCount = existingPref.recommendCount * existingPref.acceptanceRate

      if (event.action === "ACCEPTED") {
        acceptedCount++
      }

      const newAcceptanceRate = acceptedCount / totalRecommendations

      // Adjust preference score
      let scoreAdjustment = 0
      if (event.action === "ACCEPTED") {
        scoreAdjustment = 0.15
      } else if (event.action === "REJECTED") {
        scoreAdjustment = -0.2
      } else if (event.action === "SAVED") {
        scoreAdjustment = 0.05
      }

      await prisma.userFoodPreference.update({
        where: {
          userId_foodId: {
            userId: event.userId,
            foodId: event.foodId,
          },
        },
        data: {
          recommendCount: totalRecommendations,
          acceptanceRate: newAcceptanceRate,
          preferenceScore: Math.max(0, Math.min(1, existingPref.preferenceScore + scoreAdjustment)),
        },
      })
    } else {
      // Create new preference from feedback
      await prisma.userFoodPreference.create({
        data: {
          userId: event.userId,
          foodId: event.foodId,
          preferenceScore: event.action === "ACCEPTED" ? 0.7 : 0.3,
          eatCount: 0,
          recommendCount: 1,
          acceptanceRate: event.action === "ACCEPTED" ? 1.0 : 0.0,
        },
      })
    }

    console.log(`[v0] PersonalizationHandler: Updated preference based on ${event.action} feedback`)
  } catch (error) {
    console.error("[v0] PersonalizationHandler: Error processing feedback:", error)
  }
}
