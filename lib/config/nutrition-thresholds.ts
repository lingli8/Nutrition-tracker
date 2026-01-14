/**
 * Nutrition Thresholds Configuration
 *
 * This file contains all configurable thresholds and parameters used in nutrition calculations.
 * All values are based on scientific research and can be adjusted based on user data analysis.
 */

/**
 * Nutrient deficiency warning threshold
 *
 * Based on: WHO recommendation of 70% as "insufficient" boundary
 * Reference: https://www.who.int/publications/nutrient-requirements
 *
 * Default: 0.7 (70% of daily target)
 * Range: 0.6 - 0.8
 */
export const DEFICIENCY_WARNING_RATIO = 0.7

/**
 * Menstrual Cycle Phase Calorie Adjustments
 *
 * Based on: Stacy Sims research showing BMR variations across cycle phases
 * Reference: ROAR: How to Match Your Food and Fitness to Your Female Physiology
 */
export const CYCLE_CALORIE_MULTIPLIERS = {
  MENSTRUAL: 1.0, // Days 1-5: Normal baseline
  FOLLICULAR: 0.98, // Days 6-13: Slightly lower (estrogen rising, more insulin sensitive)
  OVULATION: 1.02, // Days 14-16: Slight increase (peak metabolic flexibility)
  EARLY_LUTEAL: 1.05, // Days 17-23: Moderate increase (progesterone rising)
  LATE_LUTEAL: 1.08, // Days 24-28: Highest increase (5-10% BMR increase)
} as const

/**
 * Menstrual Cycle Phase Macronutrient Ratios
 *
 * Based on: Hormonal effects on metabolism and nutrient utilization
 * Reference: Stacy Sims, "ROAR" Chapter 4
 */
export const CYCLE_MACRO_RATIOS = {
  MENSTRUAL: {
    protein: 1.2, // g/kg - Higher to support recovery and iron absorption
    carbs: 4.0, // g/kg - Moderate carbs
    fat: 0.8, // g/kg - Moderate fat
  },
  FOLLICULAR: {
    protein: 1.0, // g/kg - Normal protein
    carbs: 5.0, // g/kg - Higher carbs (better glucose tolerance)
    fat: 0.7, // g/kg - Lower fat
  },
  OVULATION: {
    protein: 1.1, // g/kg - Slightly elevated
    carbs: 4.5, // g/kg - Moderate-high carbs
    fat: 0.8, // g/kg - Moderate fat
  },
  EARLY_LUTEAL: {
    protein: 1.3, // g/kg - Higher protein
    carbs: 3.5, // g/kg - Lower carbs
    fat: 1.0, // g/kg - Higher fat
  },
  LATE_LUTEAL: {
    protein: 1.4, // g/kg - Highest protein (insulin resistance, PMS)
    carbs: 3.0, // g/kg - Lowest carbs
    fat: 1.2, // g/kg - Highest fat
  },
} as const

/**
 * Micronutrient adjustment multipliers by cycle phase
 *
 * Based on: Increased needs during specific phases
 */
export const CYCLE_MICRONUTRIENT_MULTIPLIERS = {
  MENSTRUAL: {
    iron: 1.5, // 50% increase during menstruation
    vitamin_c: 1.2, // Enhance iron absorption
    magnesium: 1.1,
  },
  FOLLICULAR: {
    iron: 1.0,
    vitamin_c: 1.0,
    magnesium: 1.0,
  },
  OVULATION: {
    iron: 1.0,
    vitamin_c: 1.0,
    magnesium: 1.0,
  },
  EARLY_LUTEAL: {
    iron: 1.1,
    vitamin_c: 1.0,
    magnesium: 1.2, // PMS prevention
  },
  LATE_LUTEAL: {
    iron: 1.2,
    vitamin_c: 1.1,
    magnesium: 1.3, // Peak PMS symptoms
    calcium: 1.2, // Mood support
    vitamin_b6: 1.3, // Hormone metabolism
  },
} as const

/**
 * Activity level multipliers for calorie calculation
 */
export const ACTIVITY_MULTIPLIERS = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTREMELY_ACTIVE: 1.9,
} as const

/**
 * User-specific optimal threshold calculator
 *
 * Based on: Historical data analysis of different user groups
 */
export function getOptimalThreshold(userProfile: {
  isHighlyActive?: boolean
  hasHealthCondition?: boolean
  age?: number
}): number {
  // Athletes are more sensitive to nutrient deficiencies
  if (userProfile.isHighlyActive) {
    return 0.75
  }

  // Users with health conditions need stricter monitoring
  if (userProfile.hasHealthCondition) {
    return 0.8
  }

  // Older users may need higher thresholds
  if (userProfile.age && userProfile.age > 50) {
    return 0.75
  }

  return DEFICIENCY_WARNING_RATIO // Default 0.7
}

/**
 * Streak milestone thresholds
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const

/**
 * Achievement XP values
 */
export const ACHIEVEMENT_XP = {
  FIRST_LOG: 10,
  DAILY_GOAL_MET: 20,
  WEEKLY_STREAK: 50,
  MONTHLY_STREAK: 200,
  LEGENDARY_ACHIEVEMENT: 500,
} as const

/**
 * Recommendation acceptance threshold
 * Foods with acceptance rate below this won't be recommended for 30 days
 */
export const MIN_ACCEPTANCE_RATE = 0.3 // 30%

/**
 * Preference score decay factor
 * How quickly old preferences become less relevant
 */
export const PREFERENCE_DECAY_DAYS = 90 // 3 months

export type CyclePhase = keyof typeof CYCLE_CALORIE_MULTIPLIERS
