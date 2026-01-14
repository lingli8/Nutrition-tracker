import type { CyclePhase, StacySimsRecommendation } from "./types"
import {
  CYCLE_CALORIE_MULTIPLIERS,
  CYCLE_MACRO_RATIOS,
  CYCLE_MICRONUTRIENT_MULTIPLIERS,
  ACTIVITY_MULTIPLIERS,
} from "./config/nutrition-thresholds"

export const STACY_SIMS_PROTOCOLS: Record<CyclePhase, StacySimsRecommendation> = {
  MENSTRUAL: {
    phase: "MENSTRUAL",
    calorieAdjustment: CYCLE_CALORIE_MULTIPLIERS.MENSTRUAL,
    proteinMultiplier: 1.2,
    carbMultiplier: 0.9,
    fatMultiplier: 1.0,
    keyNutrients: ["iron", "vitamin B12", "magnesium", "omega-3"],
    trainingRecommendations: [
      "Focus on low to moderate intensity workouts",
      "Prioritize rest and recovery",
      "Consider yoga or light cardio",
      "Stay hydrated - aim for 2.5-3L water",
    ],
    supplementSuggestions: [
      "Iron supplement (if low ferritin)",
      "Magnesium glycinate 400mg",
      "Omega-3 fatty acids 2-3g",
    ],
  },
  FOLLICULAR: {
    phase: "FOLLICULAR",
    calorieAdjustment: CYCLE_CALORIE_MULTIPLIERS.FOLLICULAR,
    proteinMultiplier: 1.0,
    carbMultiplier: 1.2,
    fatMultiplier: 0.9,
    keyNutrients: ["vitamin E", "folate", "zinc", "complex carbs"],
    trainingRecommendations: [
      "Optimal time for high-intensity training",
      "Build strength with heavy lifting",
      "Take advantage of high energy levels",
      "Excellent recovery capacity",
    ],
    supplementSuggestions: ["B-complex vitamins", "Zinc 15-30mg", "Vitamin E 400IU"],
  },
  OVULATION: {
    phase: "OVULATION",
    calorieAdjustment: CYCLE_CALORIE_MULTIPLIERS.OVULATION,
    proteinMultiplier: 1.1,
    carbMultiplier: 1.1,
    fatMultiplier: 0.9,
    keyNutrients: ["antioxidants", "vitamin C", "selenium", "protein"],
    trainingRecommendations: [
      "Peak performance window",
      "Ideal for PRs and competitions",
      "Maximum power output available",
      "Enhanced coordination and reaction time",
    ],
    supplementSuggestions: ["Vitamin C 1000mg", "Selenium 200mcg", "Antioxidant blend"],
  },
  LUTEAL_EARLY: {
    phase: "LUTEAL_EARLY",
    calorieAdjustment: CYCLE_CALORIE_MULTIPLIERS.EARLY_LUTEAL,
    proteinMultiplier: 1.3,
    carbMultiplier: 1.0,
    fatMultiplier: 1.1,
    keyNutrients: ["protein", "healthy fats", "calcium", "vitamin D"],
    trainingRecommendations: [
      "Increase protein intake for recovery",
      "Moderate intensity workouts",
      "Focus on strength maintenance",
      "Prioritize sleep quality",
    ],
    supplementSuggestions: ["Calcium 800-1000mg", "Vitamin D 2000-4000IU", "Magnesium 300-400mg"],
  },
  LUTEAL_LATE: {
    phase: "LUTEAL_LATE",
    calorieAdjustment: CYCLE_CALORIE_MULTIPLIERS.LATE_LUTEAL,
    proteinMultiplier: 1.4,
    carbMultiplier: 0.85,
    fatMultiplier: 1.2,
    keyNutrients: ["protein", "magnesium", "vitamin B6", "complex carbs"],
    trainingRecommendations: [
      "Reduce training intensity",
      "Focus on movement and mobility",
      "Manage stress levels",
      "Increase rest days",
    ],
    supplementSuggestions: [
      "Magnesium glycinate 400-600mg",
      "Vitamin B6 50-100mg",
      "Evening primrose oil",
      "Chasteberry (Vitex) if PMS symptoms",
    ],
  },
}

export function calculateCyclePhase(startDate: Date, cycleLength = 28, periodLength = 5): CyclePhase {
  const today = new Date()
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dayInCycle = (daysSinceStart % cycleLength) + 1

  if (dayInCycle <= periodLength) {
    return "MENSTRUAL"
  } else if (dayInCycle <= 13) {
    return "FOLLICULAR"
  } else if (dayInCycle <= 16) {
    return "OVULATION"
  } else if (dayInCycle <= 24) {
    return "LUTEAL_EARLY"
  } else {
    return "LUTEAL_LATE"
  }
}

export function calculateNutritionGoals(weight: number, activityLevel: string, cyclePhase: CyclePhase) {
  const protocol = STACY_SIMS_PROTOCOLS[cyclePhase]
  const macroRatios = CYCLE_MACRO_RATIOS[cyclePhase]
  const microMultipliers = CYCLE_MICRONUTRIENT_MULTIPLIERS[cyclePhase]

  // Base BMR calculation (Mifflin-St Jeor approximation)
  let baseCalories = weight * 24

  // Apply activity multiplier from configuration
  const activityMultiplier =
    ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || ACTIVITY_MULTIPLIERS.MODERATELY_ACTIVE
  baseCalories *= activityMultiplier

  // Apply cycle phase adjustment from configuration
  baseCalories *= protocol.calorieAdjustment

  // Macronutrient calculations using research-based ratios (g/kg body weight)
  const protein = weight * macroRatios.protein
  const carbs = weight * macroRatios.carbs
  const fat = weight * macroRatios.fat

  // Micronutrients with cycle-phase adjustments
  const baseIron = 15 // mg
  const baseMagnesium = 320 // mg
  const baseVitaminC = 75 // mg

  return {
    calories: Math.round(baseCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(weight * 0.4),
    iron: Math.round(baseIron * (microMultipliers.iron || 1.0)),
    magnesium: Math.round(baseMagnesium * (microMultipliers.magnesium || 1.0)),
    vitaminC: Math.round(baseVitaminC * (microMultipliers.vitamin_c || 1.0)),
    calcium: 1000,
    vitaminD: 2000,
  }
}
