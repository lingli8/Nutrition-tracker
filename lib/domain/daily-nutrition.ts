/**
 * Rich Domain Model: Daily Nutrition
 *
 * Encapsulates all business logic related to daily nutrition tracking,
 * including goal calculations, deficiency detection, and progress tracking.
 */

import { DEFAULT_NUTRITION_THRESHOLDS } from "@/lib/config/nutrition-thresholds"
import type { MenstrualCycle } from "./menstrual-cycle"

export interface NutrientGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
  iron: number
  calcium: number
  magnesium: number
  vitaminD: number
}

export interface NutrientActuals {
  calories: number
  protein: number
  carbs: number
  fat: number
  iron: number
  calcium: number
  magnesium: number
  vitaminD: number
}

export type DeficiencyLevel = "NONE" | "MILD" | "MODERATE" | "SEVERE"

export interface NutrientStatus {
  nutrient: string
  actual: number
  target: number
  percentage: number
  level: DeficiencyLevel
  message: string
}

export class DailyNutrition {
  constructor(
    public readonly date: Date,
    public readonly userId: string,
    private goals: NutrientGoals,
    private actuals: NutrientActuals,
  ) {}

  /**
   * Business Logic: Detect all nutrient deficiencies
   */
  detectDeficiencies(): NutrientStatus[] {
    const thresholds = DEFAULT_NUTRITION_THRESHOLDS
    const statuses: NutrientStatus[] = []

    const nutrients: (keyof NutrientGoals)[] = [
      "calories",
      "protein",
      "carbs",
      "fat",
      "iron",
      "calcium",
      "magnesium",
      "vitaminD",
    ]

    for (const nutrient of nutrients) {
      const actual = this.actuals[nutrient]
      const target = this.goals[nutrient]
      const percentage = target > 0 ? actual / target : 0

      let level: DeficiencyLevel = "NONE"
      let message = ""

      if (percentage < thresholds.severeDeficiencyRatio) {
        level = "SEVERE"
        message = `Critical: Only ${(percentage * 100).toFixed(0)}% of daily ${nutrient} target met. Immediate attention needed.`
      } else if (percentage < thresholds.deficiencyWarningRatio) {
        level = "MODERATE"
        message = `Warning: ${(percentage * 100).toFixed(0)}% of daily ${nutrient} target met. Consider adding ${nutrient}-rich foods.`
      } else if (percentage < 0.9) {
        level = "MILD"
        message = `${(percentage * 100).toFixed(0)}% of ${nutrient} target met. You're close to your goal!`
      } else if (percentage > thresholds.excessWarningRatio) {
        level = "MODERATE"
        message = `You've consumed ${(percentage * 100).toFixed(0)}% of your ${nutrient} target. Consider reducing intake.`
      }

      if (level !== "NONE") {
        statuses.push({
          nutrient,
          actual,
          target,
          percentage,
          level,
          message,
        })
      }
    }

    return statuses.sort((a, b) => {
      const levelOrder = { SEVERE: 0, MODERATE: 1, MILD: 2, NONE: 3 }
      return levelOrder[a.level] - levelOrder[b.level]
    })
  }

  /**
   * Business Logic: Calculate overall nutrition score (0-100)
   */
  calculateNutritionScore(): number {
    const nutrients: (keyof NutrientGoals)[] = [
      "calories",
      "protein",
      "carbs",
      "fat",
      "iron",
      "calcium",
      "magnesium",
      "vitaminD",
    ]

    let totalScore = 0

    for (const nutrient of nutrients) {
      const actual = this.actuals[nutrient]
      const target = this.goals[nutrient]
      const percentage = target > 0 ? actual / target : 0

      // Optimal range: 90-110%
      let score = 0
      if (percentage >= 0.9 && percentage <= 1.1) {
        score = 100 // Perfect
      } else if (percentage >= 0.7 && percentage < 0.9) {
        score = 70 + ((percentage - 0.7) / 0.2) * 30 // 70-100
      } else if (percentage > 1.1 && percentage <= 1.5) {
        score = 100 - ((percentage - 1.1) / 0.4) * 30 // 100-70
      } else if (percentage < 0.7) {
        score = (percentage / 0.7) * 70 // 0-70
      } else {
        score = 40 // Too much (>150%)
      }

      totalScore += score
    }

    return Math.round(totalScore / nutrients.length)
  }

  /**
   * Business Logic: Adjust goals based on cycle phase
   */
  adjustGoalsForCycle(cycle: MenstrualCycle): DailyNutrition {
    const multipliers = cycle.getNutrientMultipliers()

    const adjustedGoals: NutrientGoals = {
      calories: this.goals.calories * multipliers.calories,
      protein: this.goals.protein * multipliers.protein,
      carbs: this.goals.carbs * multipliers.carbs,
      fat: this.goals.fat, // Fat typically stays consistent
      iron: this.goals.iron * multipliers.iron,
      calcium: this.goals.calcium,
      magnesium: this.goals.magnesium * multipliers.magnesium,
      vitaminD: this.goals.vitaminD,
    }

    return new DailyNutrition(this.date, this.userId, adjustedGoals, this.actuals)
  }

  /**
   * Business Logic: Get most deficient nutrients (for recommendations)
   */
  getMostDeficientNutrients(limit = 3): string[] {
    return this.detectDeficiencies()
      .filter((s) => s.level === "SEVERE" || s.level === "MODERATE")
      .slice(0, limit)
      .map((s) => s.nutrient)
  }

  /**
   * Business Logic: Check if daily goals are met
   */
  areGoalsMet(): boolean {
    return this.calculateNutritionScore() >= 80
  }

  /**
   * Business Logic: Get motivational message based on progress
   */
  getProgressMessage(): string {
    const score = this.calculateNutritionScore()

    if (score >= 90) {
      return "Excellent work! You're meeting all your nutrition goals today."
    } else if (score >= 75) {
      return "Great job! You're on track with most of your nutrition goals."
    } else if (score >= 60) {
      return "You're making progress, but there's room for improvement in a few areas."
    } else {
      return "Let's focus on meeting your key nutrition targets today. Check your recommendations for helpful suggestions."
    }
  }

  /**
   * Convert to DTO for API responses
   */
  toDTO() {
    return {
      date: this.date.toISOString(),
      userId: this.userId,
      goals: this.goals,
      actuals: this.actuals,
      score: this.calculateNutritionScore(),
      deficiencies: this.detectDeficiencies(),
      goalsmet: this.areGoalsMet(),
      message: this.getProgressMessage(),
      mostDeficient: this.getMostDeficientNutrients(),
    }
  }
}
