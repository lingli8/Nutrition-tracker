/**
 * Personalization Event Listener
 *
 * Listens to user actions and updates preference model
 */

import { eventBus } from "../event-bus"
import type { FoodLoggedEvent, RecommendationFeedbackEvent } from "../domain-events"
import { prisma } from "@/lib/prisma"

export function registerPersonalizationListeners() {
  // Listen to food logging
  eventBus.on("food.logged", async (event: FoodLoggedEvent) => {
    console.log(`[v0] Personalization: Recording food eaten - ${event.data.foodName}`)

    // Update user food preference
    await prisma.userFoodPreference.upsert({
      where: {
        userId_foodName: {
          userId: event.userId,
          foodName: event.data.foodName,
        },
      },
      update: {
        eatCount: { increment: 1 },
        lastEatenAt: new Date(),
      },
      create: {
        userId: event.userId,
        foodName: event.data.foodName,
        eatCount: 1,
        acceptanceCount: 0,
        rejectionCount: 0,
        lastEatenAt: new Date(),
      },
    })
  })

  // Listen to recommendation feedback
  eventBus.on("recommendation.feedback", async (event: RecommendationFeedbackEvent) => {
    console.log(`[v0] Personalization: Recording feedback - ${event.data.action} for ${event.data.foodName}`)

    const { action, foodName } = event.data

    // Update acceptance/rejection counts
    if (action === "accepted") {
      await prisma.userFoodPreference.upsert({
        where: {
          userId_foodName: {
            userId: event.userId,
            foodName,
          },
        },
        update: {
          acceptanceCount: { increment: 1 },
        },
        create: {
          userId: event.userId,
          foodName,
          eatCount: 0,
          acceptanceCount: 1,
          rejectionCount: 0,
        },
      })
    } else if (action === "rejected") {
      await prisma.userFoodPreference.upsert({
        where: {
          userId_foodName: {
            userId: event.userId,
            foodName,
          },
        },
        update: {
          rejectionCount: { increment: 1 },
        },
        create: {
          userId: event.userId,
          foodName,
          eatCount: 0,
          acceptanceCount: 0,
          rejectionCount: 1,
        },
      })
    }

    // Store detailed feedback
    await prisma.recommendationFeedback.create({
      data: {
        userId: event.userId,
        recommendationId: event.data.recommendationId,
        action,
        reason: event.data.reason,
        timestamp: event.timestamp,
      },
    })
  })
}
