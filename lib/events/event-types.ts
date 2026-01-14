/**
 * Domain Events
 * All events that can occur in the nutrition tracker system
 */

export interface DomainEvent {
  eventId: string
  eventType: string
  timestamp: Date
  userId: string
  metadata?: Record<string, any>
}

/**
 * Food Logged Event
 * Triggered when a user logs a food entry
 */
export interface FoodLoggedEvent extends DomainEvent {
  eventType: "FOOD_LOGGED"
  foodId: string
  mealType: string
  servingSize: number
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

/**
 * Recommendation Shown Event
 * Triggered when recommendations are displayed to user
 */
export interface RecommendationShownEvent extends DomainEvent {
  eventType: "RECOMMENDATION_SHOWN"
  recommendations: Array<{
    foodId: string
    trackingId: string
    strategy: string
  }>
}

/**
 * Recommendation Feedback Event
 * Triggered when user accepts/rejects a recommendation
 */
export interface RecommendationFeedbackEvent extends DomainEvent {
  eventType: "RECOMMENDATION_FEEDBACK"
  trackingId: string
  foodId: string
  action: "ACCEPTED" | "REJECTED" | "SAVED"
  reason?: string
}

/**
 * Goal Achievement Event
 * Triggered when user achieves a nutrition or streak goal
 */
export interface GoalAchievedEvent extends DomainEvent {
  eventType: "GOAL_ACHIEVED"
  goalType: "DAILY_NUTRITION" | "STREAK" | "CUSTOM"
  goalName: string
  value: number
}

/**
 * Cycle Phase Changed Event
 * Triggered when user's menstrual cycle phase changes
 */
export interface CyclePhaseChangedEvent extends DomainEvent {
  eventType: "CYCLE_PHASE_CHANGED"
  previousPhase: string
  newPhase: string
  dayInCycle: number
}

export type AppEvent =
  | FoodLoggedEvent
  | RecommendationShownEvent
  | RecommendationFeedbackEvent
  | GoalAchievedEvent
  | CyclePhaseChangedEvent
