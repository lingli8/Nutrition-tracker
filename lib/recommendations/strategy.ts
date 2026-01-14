/**
 * Strategy Pattern for Nutrition Recommendations
 *
 * Instead of one giant if-else block, each recommendation strategy is
 * an independent, testable class. New strategies can be added without
 * modifying existing code (Open/Closed Principle).
 */

import type { MenstrualCycle } from "@/lib/domain/menstrual-cycle"
import type { RecommendationContext } from "@/lib/recommendations/strategy"

export interface FoodSuggestion {
  foodName: string
  reason: string
  personalizedExplanation: string
  nutrientContent: Record<string, number>
  priority: number
  category: string
}

export interface UserPreferences {
  dietType?: "standard" | "vegetarian" | "vegan" | "pescatarian"
  allergies: string[]
  dislikedFoods: string[]
  preferredCuisines: string[]
  acceptanceHistory: Map<string, number> // foodName -> acceptance rate
}

/**
 * Base Strategy Interface
 */
export interface RecommendationStrategy {
  /**
   * Check if this strategy should run for given context
   */
  supports(context: RecommendationContext): boolean

  /**
   * Generate food suggestions
   */
  recommend(context: RecommendationContext): Promise<FoodSuggestion[]>

  /**
   * Strategy priority (lower = higher priority)
   */
  priority(): number

  /**
   * Strategy name for logging/debugging
   */
  name(): string
}

/**
 * Strategy 1: Iron Deficiency Strategy
 *
 * Triggers when iron is deficient, especially critical during menstrual phase
 */
export class IronDeficiencyStrategy implements RecommendationStrategy {
  name(): string {
    return "IronDeficiencyStrategy"
  }

  supports(context: RecommendationContext): boolean {
    return context.deficientNutrients.includes("iron")
  }

  priority(): number {
    // Higher priority during menstrual phase
    if (context.cycle?.getCurrentPhase() === "MENSTRUAL") {
      return 1 // Highest priority
    }
    return 3
  }

  async recommend(context: RecommendationContext): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = []
    const { userPreferences, dailyNutrition, cycle } = context

    // Get actual deficiency amount
    const deficiencies = dailyNutrition.detectDeficiencies()
    const ironDeficiency = deficiencies.find((d) => d.nutrient === "iron")
    const ironGap = ironDeficiency ? ironDeficiency.target - ironDeficiency.actual : 0

    // Vegetarian/Vegan iron sources
    if (userPreferences.dietType === "vegetarian" || userPreferences.dietType === "vegan") {
      suggestions.push({
        foodName: "Spinach (cooked)",
        reason: "Rich in non-heme iron",
        personalizedExplanation: this.generateExplanation({
          food: "Spinach",
          ironContent: 2.7,
          ironGap,
          isVegetarian: true,
          cycle,
        }),
        nutrientContent: { iron: 2.7, vitaminC: 17.6 },
        priority: 90,
        category: "vegetables",
      })

      suggestions.push({
        foodName: "Lentils",
        reason: "High in iron and protein",
        personalizedExplanation: this.generateExplanation({
          food: "Lentils",
          ironContent: 3.3,
          ironGap,
          isVegetarian: true,
          cycle,
        }),
        nutrientContent: { iron: 3.3, protein: 9 },
        priority: 85,
        category: "legumes",
      })
    }

    // Non-vegetarian options
    if (userPreferences.dietType === "standard" || userPreferences.dietType === "pescatarian") {
      suggestions.push({
        foodName: "Beef (lean)",
        reason: "Heme iron - highly bioavailable",
        personalizedExplanation: this.generateExplanation({
          food: "Beef",
          ironContent: 2.6,
          ironGap,
          isVegetarian: false,
          cycle,
        }),
        nutrientContent: { iron: 2.6, protein: 26 },
        priority: 95,
        category: "meat",
      })
    }

    if (userPreferences.dietType === "standard" || userPreferences.dietType === "pescatarian") {
      suggestions.push({
        foodName: "Salmon",
        reason: "Contains iron plus omega-3",
        personalizedExplanation: this.generateExplanation({
          food: "Salmon",
          ironContent: 0.8,
          ironGap,
          isVegetarian: false,
          cycle,
        }),
        nutrientContent: { iron: 0.8, protein: 20, omega3: 2.2 },
        priority: 80,
        category: "seafood",
      })
    }

    // Filter out disliked foods and allergies
    return this.filterByPreferences(suggestions, userPreferences)
  }

  private generateExplanation(params: {
    food: string
    ironContent: number
    ironGap: number
    isVegetarian: boolean
    cycle?: MenstrualCycle
  }): string {
    const { food, ironContent, ironGap, isVegetarian, cycle } = params

    let explanation = ""

    // Why now?
    if (cycle?.getCurrentPhase() === "MENSTRUAL") {
      const dayInCycle = cycle.calculateDayInCycle()
      explanation += `You're on day ${dayInCycle} of your period. Your body is losing 30-40mg of iron during menstruation. `
    } else {
      explanation += `You're running low on iron today. `
    }

    // Why this food?
    explanation += `${food} provides ${ironContent}mg of iron per 100g. `

    // Personalized reason
    if (isVegetarian) {
      explanation += `As a plant-based eater, pairing this with vitamin C (like orange juice) will boost absorption by 3-4x. `
    } else {
      explanation += `This contains heme iron, which your body absorbs 2-3x better than plant sources. `
    }

    // How much more needed?
    explanation += `You still need ${ironGap.toFixed(1)}mg iron to reach today's target.`

    return explanation
  }

  private filterByPreferences(suggestions: FoodSuggestion[], prefs: UserPreferences): FoodSuggestion[] {
    return suggestions
      .filter((s) => !prefs.dislikedFoods.includes(s.foodName.toLowerCase()))
      .filter((s) => {
        // Check allergies (simplified - should be more comprehensive)
        const hasAllergy = prefs.allergies.some((allergy) => s.foodName.toLowerCase().includes(allergy.toLowerCase()))
        return !hasAllergy
      })
  }
}

/**
 * Strategy 2: Cycle-Aware Strategy
 *
 * Recommends foods based on current menstrual cycle phase
 */
export class CycleAwareStrategy implements RecommendationStrategy {
  name(): string {
    return "CycleAwareStrategy"
  }

  supports(context: RecommendationContext): boolean {
    return context.cycle !== undefined
  }

  priority(): number {
    return 5 // Medium priority
  }

  async recommend(context: RecommendationContext): Promise<FoodSuggestion[]> {
    if (!context.cycle) return []

    const phase = context.cycle.getCurrentPhase()
    const suggestions: FoodSuggestion[] = []

    switch (phase) {
      case "FOLLICULAR":
        // High carb tolerance - recommend complex carbs
        suggestions.push({
          foodName: "Oatmeal with berries",
          reason: "Your body processes carbs efficiently in this phase",
          personalizedExplanation: `You're in your follicular phase where estrogen is rising. Your insulin sensitivity is at its best, making this the perfect time for complex carbohydrates to fuel high-energy activities.`,
          nutrientContent: { carbs: 27, fiber: 4, protein: 6 },
          priority: 85,
          category: "breakfast",
        })
        break

      case "LATE_LUTEAL":
        // PMS phase - recommend magnesium and healthy fats
        suggestions.push({
          foodName: "Dark chocolate (70%+)",
          reason: "Magnesium helps reduce PMS symptoms",
          personalizedExplanation: `You're in the late luteal phase where progesterone peaks. Dark chocolate provides 64mg magnesium per 100g, which research shows can reduce cramps, mood swings, and bloating by 30-40%.`,
          nutrientContent: { magnesium: 64, iron: 3.3 },
          priority: 90,
          category: "snack",
        })

        suggestions.push({
          foodName: "Avocado",
          reason: "Healthy fats and magnesium for hormone balance",
          personalizedExplanation: `Your metabolism is 5-10% higher right now (proven by Barr et al. 1995 study). Avocados provide sustained energy from healthy fats plus 29mg magnesium to ease PMS symptoms.`,
          nutrientContent: { fat: 15, magnesium: 29, fiber: 7 },
          priority: 85,
          category: "healthy-fats",
        })
        break

      case "MENSTRUAL":
        // Focus on anti-inflammatory foods
        suggestions.push({
          foodName: "Ginger tea",
          reason: "Natural anti-inflammatory for cramps",
          personalizedExplanation: `Ginger contains gingerol, which acts as a natural COX-2 inhibitor (like ibuprofen) to reduce menstrual cramps. Studies show it's as effective as NSAIDs for period pain.`,
          nutrientContent: {},
          priority: 75,
          category: "beverage",
        })
        break
    }

    return suggestions
  }
}

/**
 * Strategy 3: Preference-Based Strategy
 *
 * Uses historical acceptance data to recommend foods user actually likes
 */
export class PersonalPreferenceStrategy implements RecommendationStrategy {
  name(): string {
    return "PersonalPreferenceStrategy"
  }

  supports(context: RecommendationContext): boolean {
    return context.userPreferences.acceptanceHistory.size > 5 // Need some history
  }

  priority(): number {
    return 7 // Lower priority - only to fill in suggestions
  }

  async recommend(context: RecommendationContext): Promise<FoodSuggestion[]> {
    const { userPreferences, deficientNutrients } = context

    // Find foods user liked that contain deficient nutrients
    const suggestions: FoodSuggestion[] = []

    userPreferences.acceptanceHistory.forEach((acceptanceRate, foodName) => {
      if (acceptanceRate > 0.6) {
        // User accepts this food >60% of the time
        suggestions.push({
          foodName,
          reason: "You've enjoyed this before",
          personalizedExplanation: `Based on your history, you accept this recommendation ${(acceptanceRate * 100).toFixed(0)}% of the time. We're suggesting it again to help meet your ${deficientNutrients.join(", ")} needs.`,
          nutrientContent: {}, // Would fetch from database
          priority: 70 + acceptanceRate * 20, // 70-90 range
          category: "preferred",
        })
      }
    })

    return suggestions.slice(0, 3) // Limit to top 3
  }
}

/**
 * Strategy Orchestrator
 *
 * Runs all applicable strategies and combines results
 */
export class RecommendationOrchestrator {
  private strategies: RecommendationStrategy[]

  constructor(strategies: RecommendationStrategy[]) {
    this.strategies = strategies
  }

  async generateRecommendations(context: RecommendationContext): Promise<FoodSuggestion[]> {
    // Find applicable strategies
    const applicableStrategies = this.strategies.filter((s) => s.supports(context))

    // Sort by priority
    applicableStrategies.sort((a, b) => a.priority() - b.priority())

    // Run strategies in parallel
    const results = await Promise.all(applicableStrategies.map((strategy) => strategy.recommend(context)))

    // Flatten and deduplicate
    const allSuggestions = results.flat()
    const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions)

    // Sort by priority and limit
    return uniqueSuggestions.sort((a, b) => b.priority - a.priority).slice(0, 10)
  }

  private deduplicateSuggestions(suggestions: FoodSuggestion[]): FoodSuggestion[] {
    const seen = new Map<string, FoodSuggestion>()

    for (const suggestion of suggestions) {
      const existing = seen.get(suggestion.foodName)
      if (!existing || suggestion.priority > existing.priority) {
        seen.set(suggestion.foodName, suggestion)
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Add a new strategy at runtime (useful for A/B testing)
   */
  addStrategy(strategy: RecommendationStrategy): void {
    this.strategies.push(strategy)
  }

  /**
   * Remove a strategy (useful for A/B testing)
   */
  removeStrategy(strategyName: string): void {
    this.strategies = this.strategies.filter((s) => s.name() !== strategyName)
  }
}

/**
 * Default strategies configuration
 */
export function createDefaultOrchestrator(): RecommendationOrchestrator {
  return new RecommendationOrchestrator([
    new IronDeficiencyStrategy(),
    new CycleAwareStrategy(),
    new PersonalPreferenceStrategy(),
    // Add more strategies here as needed
  ])
}
