import type { CyclePhase } from "../types"
import type { User, Food, UserFoodPreference } from "@prisma/client"

/**
 * Recommendation Context
 * Contains all information needed to generate personalized food recommendations
 */
export interface RecommendationContext {
  user: User
  cyclePhase: CyclePhase
  dayInCycle: number
  currentNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    iron?: number
    calcium?: number
    [key: string]: number | undefined
  }
  targetNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    iron?: number
    calcium?: number
    [key: string]: number | undefined
  }
  deficientNutrients: string[]
  userPreferences: UserFoodPreference[]
  mealType?: string
}

/**
 * Food Suggestion with explainability
 */
export interface FoodSuggestion {
  food: Food
  reason: string
  detailedExplanation: string
  priority: number
  trackingId: string
  nutrients: {
    calories: number
    protein: number
    carbs: number
    fat: number
    [key: string]: number
  }
}

/**
 * Base Recommendation Strategy Interface
 * All recommendation strategies must implement this interface
 */
export interface RecommendationStrategy {
  /**
   * Check if this strategy should be applied for the given context
   */
  supports(context: RecommendationContext): boolean

  /**
   * Generate food suggestions based on the context
   */
  recommend(context: RecommendationContext, availableFoods: Food[]): Promise<FoodSuggestion[]>

  /**
   * Priority of this strategy (higher = executed first)
   */
  priority(): number

  /**
   * Strategy name for logging and debugging
   */
  name(): string
}
