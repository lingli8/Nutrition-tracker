/**
 * Domain Event Definitions
 *
 * These represent significant business events in our system.
 * Each event is strongly typed and self-documenting.
 */

import type { DomainEvent } from "./event-bus"

/**
 * Event: User logged food
 */
export interface FoodLoggedEvent extends DomainEvent {
  type: "food.logged"
  data: {
    foodId: string
    foodName: string
    mealType: "breakfast" | "lunch" | "dinner" | "snack"
    calories: number
    nutrients: Record<string, number>
    servingSize: number
  }
}

/**
 * Event: User gave feedback on recommendation
 */
export interface RecommendationFeedbackEvent extends DomainEvent {
  type: "recommendation.feedback"
  data: {
    recommendationId: string
    foodName: string
    action: "accepted" | "rejected" | "saved"
    reason?: string
  }
}

/**
 * Event: User started new menstrual cycle
 */
export interface CycleStartedEvent extends DomainEvent {
  type: "cycle.started"
  data: {
    cycleId: string
    startDate: Date
    cycleLength: number
  }
}

/**
 * Event: User entered new cycle phase
 */
export interface PhaseChangedEvent extends DomainEvent {
  type: "cycle.phase_changed"
  data: {
    cycleId: string
    oldPhase: string
    newPhase: string
    dayInCycle: number
  }
}

/**
 * Event: Achievement unlocked
 */
export interface AchievementUnlockedEvent extends DomainEvent {
  type: "achievement.unlocked"
  data: {
    achievementId: string
    achievementName: string
    category: string
    xpEarned: number
  }
}

/**
 * Event: User reached nutrition goal
 */
export interface GoalReachedEvent extends DomainEvent {
  type: "goal.reached"
  data: {
    goalType: string
    targetValue: number
    actualValue: number
    date: Date
  }
}

/**
 * Helper functions to create events
 */
export function createFoodLoggedEvent(userId: string, data: FoodLoggedEvent["data"]): FoodLoggedEvent {
  return {
    id: crypto.randomUUID(),
    type: "food.logged",
    timestamp: new Date(),
    userId,
    data,
  }
}

export function createRecommendationFeedbackEvent(
  userId: string,
  data: RecommendationFeedbackEvent["data"],
): RecommendationFeedbackEvent {
  return {
    id: crypto.randomUUID(),
    type: "recommendation.feedback",
    timestamp: new Date(),
    userId,
    data,
  }
}

export function createAchievementUnlockedEvent(
  userId: string,
  data: AchievementUnlockedEvent["data"],
): AchievementUnlockedEvent {
  return {
    id: crypto.randomUUID(),
    type: "achievement.unlocked",
    timestamp: new Date(),
    userId,
    data,
  }
}
