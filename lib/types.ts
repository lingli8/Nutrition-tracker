export type CyclePhase = "MENSTRUAL" | "FOLLICULAR" | "OVULATION" | "LUTEAL_EARLY" | "LUTEAL_LATE"

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"

export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE"

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  iron?: number
  calcium?: number
  vitaminD?: number
}

export interface StacySimsRecommendation {
  phase: CyclePhase
  calorieAdjustment: number
  proteinMultiplier: number
  carbMultiplier: number
  fatMultiplier: number
  keyNutrients: string[]
  trainingRecommendations: string[]
  supplementSuggestions: string[]
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  age: number | null
  weight: number | null
  height: number | null
  activityLevel: string | null
}
