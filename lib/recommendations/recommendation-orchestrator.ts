import type { RecommendationStrategy, RecommendationContext, FoodSuggestion } from "./recommendation-strategy"
import { IronDeficiencyStrategy, ProteinDeficiencyStrategy } from "./strategies/nutrient-deficiency-strategy"
import { CycleAwareStrategy } from "./strategies/cycle-aware-strategy"
import { PersonalPreferenceStrategy } from "./strategies/personal-preference-strategy"
import type { Food } from "@prisma/client"

/**
 * Recommendation Orchestrator
 * Coordinates multiple recommendation strategies and combines their results
 */
export class RecommendationOrchestrator {
  private strategies: RecommendationStrategy[]

  constructor(customStrategies?: RecommendationStrategy[]) {
    this.strategies = customStrategies || [
      new PersonalPreferenceStrategy(),
      new IronDeficiencyStrategy(),
      new ProteinDeficiencyStrategy(),
      new CycleAwareStrategy(),
    ]

    // Sort strategies by priority (highest first)
    this.strategies.sort((a, b) => b.priority() - a.priority())
  }

  /**
   * Generate comprehensive recommendations by running all applicable strategies
   */
  async generateRecommendations(context: RecommendationContext, availableFoods: Food[]): Promise<FoodSuggestion[]> {
    const allSuggestions: FoodSuggestion[] = []

    // Run each strategy that supports this context
    for (const strategy of this.strategies) {
      if (strategy.supports(context)) {
        console.log(`[v0] Running strategy: ${strategy.name()}`)
        try {
          const suggestions = await strategy.recommend(context, availableFoods)
          allSuggestions.push(...suggestions)
        } catch (error) {
          console.error(`[v0] Strategy ${strategy.name()} failed:`, error)
        }
      }
    }

    // Remove duplicates (same food recommended by multiple strategies)
    const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions)

    // Sort by priority and limit to top 10
    return uniqueSuggestions.sort((a, b) => b.priority - a.priority).slice(0, 10)
  }

  /**
   * Deduplicate suggestions - if same food appears multiple times, keep the highest priority one
   */
  private deduplicateSuggestions(suggestions: FoodSuggestion[]): FoodSuggestion[] {
    const foodMap = new Map<string, FoodSuggestion>()

    for (const suggestion of suggestions) {
      const existingSuggestion = foodMap.get(suggestion.food.id)

      if (!existingSuggestion || suggestion.priority > existingSuggestion.priority) {
        foodMap.set(suggestion.food.id, suggestion)
      }
    }

    return Array.from(foodMap.values())
  }

  /**
   * Add a custom strategy dynamically (useful for A/B testing)
   */
  addStrategy(strategy: RecommendationStrategy): void {
    this.strategies.push(strategy)
    this.strategies.sort((a, b) => b.priority() - a.priority())
  }

  /**
   * Remove a strategy by name
   */
  removeStrategy(strategyName: string): void {
    this.strategies = this.strategies.filter((s) => s.name() !== strategyName)
  }
}
