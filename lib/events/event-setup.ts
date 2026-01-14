import { eventBus } from "./event-bus"
import { handleFoodLogged, handleRecommendationFeedback } from "./handlers/personalization-handler"
import { handleFoodLoggedForGamification } from "./handlers/gamification-handler"

/**
 * Initialize Event Bus
 * Register all event handlers
 */
export function initializeEventBus() {
  // Personalization handlers
  eventBus.on("FOOD_LOGGED", handleFoodLogged)
  eventBus.on("RECOMMENDATION_FEEDBACK", handleRecommendationFeedback)

  // Gamification handlers
  eventBus.on("FOOD_LOGGED", handleFoodLoggedForGamification)

  console.log("[v0] EventBus: All handlers registered")
}
