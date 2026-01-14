import type { RecommendationStrategy, RecommendationContext, FoodSuggestion } from "../recommendation-strategy"
import type { Food } from "@prisma/client"

/**
 * Cycle-Aware Strategy
 * Recommends foods based on optimal macronutrient ratios for each cycle phase
 */
export class CycleAwareStrategy implements RecommendationStrategy {
  name(): string {
    return "CycleAwareStrategy"
  }

  priority(): number {
    return 70
  }

  supports(context: RecommendationContext): boolean {
    // Always applicable
    return true
  }

  async recommend(context: RecommendationContext, availableFoods: Food[]): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = []

    // Determine optimal macronutrient focus based on cycle phase
    let focusNutrient: "carbs" | "protein" | "fat" = "carbs"
    let phaseGuidance = ""

    switch (context.cyclePhase) {
      case "FOLLICULAR":
        focusNutrient = "carbs"
        phaseGuidance =
          "During the follicular phase, your body is more insulin-sensitive and handles carbohydrates efficiently"
        break
      case "OVULATION":
        focusNutrient = "protein"
        phaseGuidance = "During ovulation, increased protein supports your body's peak performance window"
        break
      case "LUTEAL_EARLY":
      case "LUTEAL_LATE":
        focusNutrient = "protein"
        phaseGuidance =
          "During the luteal phase, higher protein and healthy fats help combat insulin resistance and support hormonal balance"
        break
      case "MENSTRUAL":
        focusNutrient = "protein"
        phaseGuidance = "During menstruation, prioritize protein and iron-rich foods to support recovery"
        break
    }

    // Find foods that match the phase requirements
    const matchingFoods = availableFoods
      .filter((food) => {
        const nutrientValue = food[focusNutrient] || 0
        return nutrientValue > 10 // Significant amount
      })
      .sort((a, b) => (b[focusNutrient] || 0) - (a[focusNutrient] || 0))
      .slice(0, 2)

    for (const food of matchingFoods) {
      const nutrientAmount = food[focusNutrient] || 0

      const explanation = `${phaseGuidance}. ${food.name} is an excellent choice with ${nutrientAmount.toFixed(1)}g of ${focusNutrient} per 100g.`

      suggestions.push({
        food,
        reason: `Optimized for ${context.cyclePhase} phase`,
        detailedExplanation: explanation,
        priority: 70,
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
