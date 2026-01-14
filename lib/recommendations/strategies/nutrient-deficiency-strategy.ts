import type { RecommendationStrategy, RecommendationContext, FoodSuggestion } from "../recommendation-strategy"
import type { Food } from "@prisma/client"
import { DEFICIENCY_WARNING_RATIO } from "@/lib/config/nutrition-thresholds"

/**
 * Iron Deficiency Strategy
 * Recommends iron-rich foods when user is below threshold
 */
export class IronDeficiencyStrategy implements RecommendationStrategy {
  name(): string {
    return "IronDeficiencyStrategy"
  }

  priority(): number {
    return 100 // High priority during menstrual phase
  }

  supports(context: RecommendationContext): boolean {
    return context.deficientNutrients.includes("iron")
  }

  async recommend(context: RecommendationContext, availableFoods: Food[]): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = []

    // Filter iron-rich foods
    const ironRichFoods = availableFoods
      .filter((food) => (food.iron || 0) > 2.0) // > 2mg per 100g
      .sort((a, b) => (b.iron || 0) - (a.iron || 0))

    // Check user dietary preferences
    const isVegetarian = context.user.dietaryRestrictions?.includes("vegetarian")

    const targetFoods = ironRichFoods.slice(0, 3)

    for (const food of targetFoods) {
      const ironGap = (context.targetNutrition.iron || 18) - (context.currentNutrition.iron || 0)

      let explanation = ""

      if (context.cyclePhase === "MENSTRUAL") {
        explanation = `You are on day ${context.dayInCycle} of your period, and your body is actively losing iron. `
      }

      explanation += `${food.name} contains ${food.iron?.toFixed(1)}mg of iron per 100g. `

      if (isVegetarian) {
        explanation += `As a vegetarian, this is an excellent plant-based iron source. `
      }

      explanation += `You still need ${ironGap.toFixed(1)}mg of iron today to meet your target.`

      // Increase priority during menstrual phase
      let priority = 80
      if (context.cyclePhase === "MENSTRUAL") {
        priority = 95
      }

      suggestions.push({
        food,
        reason: `High in iron (${food.iron?.toFixed(1)}mg per 100g)`,
        detailedExplanation: explanation,
        priority,
        trackingId: crypto.randomUUID(),
        nutrients: {
          calories: food.calories || 0,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fat: food.fat || 0,
          iron: food.iron || 0,
        },
      })
    }

    return suggestions
  }
}

/**
 * Protein Deficiency Strategy
 */
export class ProteinDeficiencyStrategy implements RecommendationStrategy {
  name(): string {
    return "ProteinDeficiencyStrategy"
  }

  priority(): number {
    return 85
  }

  supports(context: RecommendationContext): boolean {
    const currentProteinRatio = context.currentNutrition.protein / context.targetNutrition.protein
    return currentProteinRatio < DEFICIENCY_WARNING_RATIO
  }

  async recommend(context: RecommendationContext, availableFoods: Food[]): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = []

    const proteinRichFoods = availableFoods
      .filter((food) => (food.protein || 0) > 15) // > 15g per 100g
      .sort((a, b) => (b.protein || 0) - (a.protein || 0))
      .slice(0, 3)

    for (const food of proteinRichFoods) {
      const proteinGap = context.targetNutrition.protein - context.currentNutrition.protein

      let explanation = ""

      if (context.cyclePhase === "LUTEAL_LATE" || context.cyclePhase === "LUTEAL_EARLY") {
        explanation = `During the luteal phase, your protein needs increase to ${context.targetNutrition.protein}g per day for optimal recovery and to combat insulin resistance. `
      }

      explanation += `${food.name} provides ${food.protein?.toFixed(1)}g of protein per 100g. `
      explanation += `You need ${proteinGap.toFixed(1)}g more protein today.`

      suggestions.push({
        food,
        reason: `High-quality protein source (${food.protein?.toFixed(1)}g per 100g)`,
        detailedExplanation: explanation,
        priority: 85,
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
