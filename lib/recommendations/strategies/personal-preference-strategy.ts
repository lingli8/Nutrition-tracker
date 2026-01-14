import type { RecommendationStrategy, RecommendationContext, FoodSuggestion } from "../recommendation-strategy"
import type { Food } from "@prisma/client"
import { MIN_ACCEPTANCE_RATE } from "@/lib/config/nutrition-thresholds"

/**
 * Personal Preference Strategy
 * Recommends foods based on user's historical preferences and acceptance patterns
 */
export class PersonalPreferenceStrategy implements RecommendationStrategy {
  name(): string {
    return "PersonalPreferenceStrategy"
  }

  priority(): number {
    return 90 // High priority - we know user likes these
  }

  supports(context: RecommendationContext): boolean {
    // Only applicable if user has preference history
    return context.userPreferences.length > 0
  }

  async recommend(context: RecommendationContext, availableFoods: Food[]): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = []

    // Filter preferences above minimum acceptance threshold
    const acceptedPreferences = context.userPreferences
      .filter((pref) => pref.acceptanceRate >= MIN_ACCEPTANCE_RATE)
      .sort((a, b) => b.preferenceScore - a.preferenceScore)
      .slice(0, 5)

    // Match preferences with available foods
    for (const pref of acceptedPreferences) {
      const food = availableFoods.find((f) => f.id === pref.foodId)
      if (!food) continue

      const explanation = `Based on your history, you've eaten ${food.name} ${pref.eatCount} times with a ${(pref.acceptanceRate * 100).toFixed(0)}% acceptance rate. You seem to enjoy this food, and it fits well into your nutrition goals.`

      suggestions.push({
        food,
        reason: `You love this (${(pref.acceptanceRate * 100).toFixed(0)}% acceptance)`,
        detailedExplanation: explanation,
        priority: 90 + pref.preferenceScore * 5, // Higher score = higher priority
        trackingId: crypto.randomUUID(),
        nutrients: {
          calories: food.calories || 0,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fat: food.fat || 0,
        },
      })
    }

    return suggestions
  }
}
