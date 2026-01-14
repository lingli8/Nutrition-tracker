/**
 * Rich Domain Model: Menstrual Cycle
 *
 * This is NOT just data - it contains business logic and behavior.
 * The entity knows how to calculate its own state, predict future dates,
 * and provide nutrition recommendations.
 */

import { DEFAULT_NUTRITION_THRESHOLDS } from "@/lib/config/nutrition-thresholds"

export type CyclePhase = "MENSTRUAL" | "FOLLICULAR" | "OVULATION" | "EARLY_LUTEAL" | "LATE_LUTEAL"

export interface CycleHealth {
  status: "NORMAL" | "SHORT" | "LONG" | "IRREGULAR"
  message?: string
  shouldConsultDoctor: boolean
}

export class MenstrualCycle {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly startDate: Date,
    public readonly cycleLength: number,
    public readonly periodLength: number,
  ) {}

  /**
   * Business Logic: Calculate current phase based on today's date
   */
  getCurrentPhase(today: Date = new Date()): CyclePhase {
    const dayInCycle = this.calculateDayInCycle(today)
    return this.getPhaseForDay(dayInCycle)
  }

  /**
   * Business Logic: Determine phase from day number
   */
  private getPhaseForDay(day: number): CyclePhase {
    if (day <= this.periodLength) {
      return "MENSTRUAL"
    }

    const ovulationDay = this.cycleLength - 14 // Ovulation typically 14 days before next period

    if (day <= Math.floor(this.cycleLength * 0.4)) {
      return "FOLLICULAR"
    }

    if (day >= ovulationDay - 2 && day <= ovulationDay + 2) {
      return "OVULATION"
    }

    if (day <= Math.floor(this.cycleLength * 0.75)) {
      return "EARLY_LUTEAL"
    }

    return "LATE_LUTEAL"
  }

  /**
   * Business Logic: Calculate day in current cycle
   */
  calculateDayInCycle(today: Date): number {
    const daysSinceStart = Math.floor((today.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24))
    return (daysSinceStart % this.cycleLength) + 1
  }

  /**
   * Business Logic: Check if currently in fertile window
   */
  isInFertileWindow(today: Date = new Date()): boolean {
    const phase = this.getCurrentPhase(today)
    return phase === "OVULATION"
  }

  /**
   * Business Logic: Predict next period start date
   */
  predictNextPeriod(): Date {
    const nextPeriodDate = new Date(this.startDate)
    nextPeriodDate.setDate(this.startDate.getDate() + this.cycleLength)
    return nextPeriodDate
  }

  /**
   * Business Logic: Predict ovulation date
   */
  predictOvulation(): Date {
    const ovulationDate = new Date(this.startDate)
    ovulationDate.setDate(this.startDate.getDate() + (this.cycleLength - 14))
    return ovulationDate
  }

  /**
   * Business Logic: Get nutrition multipliers for current phase
   */
  getNutrientMultipliers(today: Date = new Date()) {
    const phase = this.getCurrentPhase(today)
    const phaseKey = phase
      .toLowerCase()
      .replace("_", "") as keyof typeof DEFAULT_NUTRITION_THRESHOLDS.cyclePhaseMultipliers

    return DEFAULT_NUTRITION_THRESHOLDS.cyclePhaseMultipliers[phaseKey]
  }

  /**
   * Business Logic: Health check for cycle normality
   */
  assessCycleHealth(): CycleHealth {
    // Normal cycle: 21-35 days
    if (this.cycleLength < 21) {
      return {
        status: "SHORT",
        message: `Your cycle length (${this.cycleLength} days) is shorter than typical. This could indicate hormonal imbalance.`,
        shouldConsultDoctor: true,
      }
    }

    if (this.cycleLength > 35) {
      return {
        status: "LONG",
        message: `Your cycle length (${this.cycleLength} days) is longer than typical. Consider tracking for 3 cycles to identify patterns.`,
        shouldConsultDoctor: this.cycleLength > 40,
      }
    }

    // Normal period: 3-7 days
    if (this.periodLength < 3 || this.periodLength > 7) {
      return {
        status: "IRREGULAR",
        message: `Your period length (${this.periodLength} days) is outside normal range. This is common but worth monitoring.`,
        shouldConsultDoctor: this.periodLength > 8,
      }
    }

    return {
      status: "NORMAL",
      shouldConsultDoctor: false,
    }
  }

  /**
   * Business Logic: Check if cycle data is stale
   */
  isStale(today: Date = new Date()): boolean {
    const daysSinceStart = Math.floor((today.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Data is stale if it's more than 2 cycles old
    return daysSinceStart > this.cycleLength * 2
  }

  /**
   * Business Logic: Get phase-specific advice
   */
  getPhaseAdvice(today: Date = new Date()): string {
    const phase = this.getCurrentPhase(today)
    const dayInCycle = this.calculateDayInCycle(today)

    const advice = {
      MENSTRUAL: `Day ${dayInCycle} of your period. Focus on iron-rich foods and rest. Your body needs extra nutrients to recover.`,
      FOLLICULAR: `Day ${dayInCycle} - Follicular phase. Your energy is rising! Great time for high-intensity workouts and complex carbs.`,
      OVULATION: `Day ${dayInCycle} - Peak fertility. You're at your strongest! Optimal time for challenging activities and social engagement.`,
      EARLY_LUTEAL: `Day ${dayInCycle} - Early luteal phase. Metabolism is increasing. Add more protein and healthy fats to your meals.`,
      LATE_LUTEAL: `Day ${dayInCycle} - Late luteal phase. PMS symptoms may appear. Prioritize magnesium, reduce processed carbs, and practice self-care.`,
    }

    return advice[phase]
  }

  /**
   * Business Logic: Calculate expected symptoms for current phase
   */
  getExpectedSymptoms(today: Date = new Date()): string[] {
    const phase = this.getCurrentPhase(today)

    const symptoms: Record<CyclePhase, string[]> = {
      MENSTRUAL: ["Cramps", "Fatigue", "Lower back pain", "Headaches"],
      FOLLICULAR: ["Increased energy", "Improved mood", "Better skin"],
      OVULATION: ["Peak energy", "Increased libido", "Mild bloating"],
      EARLY_LUTEAL: ["Stable energy", "Good focus"],
      LATE_LUTEAL: ["Fatigue", "Bloating", "Mood swings", "Food cravings", "Breast tenderness"],
    }

    return symptoms[phase]
  }

  /**
   * Factory Method: Create from database record
   */
  static fromDatabase(record: any): MenstrualCycle {
    return new MenstrualCycle(
      record.id,
      record.userId,
      new Date(record.startDate),
      record.cycleLength,
      record.periodLength,
    )
  }

  /**
   * Convert to plain object for API responses
   */
  toDTO() {
    const today = new Date()
    const phase = this.getCurrentPhase(today)
    const dayInCycle = this.calculateDayInCycle(today)
    const health = this.assessCycleHealth()

    return {
      id: this.id,
      userId: this.userId,
      startDate: this.startDate.toISOString(),
      cycleLength: this.cycleLength,
      periodLength: this.periodLength,
      currentPhase: phase,
      dayInCycle,
      nextPeriod: this.predictNextPeriod().toISOString(),
      nextOvulation: this.predictOvulation().toISOString(),
      isInFertileWindow: this.isInFertileWindow(today),
      health,
      advice: this.getPhaseAdvice(today),
      expectedSymptoms: this.getExpectedSymptoms(today),
      nutrientMultipliers: this.getNutrientMultipliers(today),
    }
  }
}
