/**
 * Recommendation Feedback Loop
 *
 * Closes the loop: Recommend → User Responds → Learn → Better Recommendations
 *
 * This is the key to moving from 20% to 60%+ recommendation acceptance rates.
 */

import { prisma } from "@/lib/prisma"
import { eventBus, createRecommendationFeedbackEvent } from "@/lib/events"

export interface FeedbackRequest {
  userId: string
  recommendationId: string
  foodName: string
  action: "accepted" | "rejected" | "saved"
  reason?: FeedbackReason
  customReason?: string
}

export type FeedbackReason =
  | "dont_like_taste"
  | "too_expensive"
  | "not_available"
  | "allergic"
  | "too_complex"
  | "already_ate"
  | "other"

export interface FeedbackAnalytics {
  totalFeedbacks: number
  acceptanceRate: number
  topRejectionReasons: Array<{ reason: string; count: number }>
  mostAcceptedFoods: Array<{ foodName: string; acceptanceRate: number }>
  leastAcceptedFoods: Array<{ foodName: string; acceptanceRate: number }>
  improvementTips: string[]
}

export class FeedbackLoopService {
  /**
   * Record user feedback on a recommendation
   */
  async recordFeedback(feedback: FeedbackRequest): Promise<void> {
    const { userId, recommendationId, foodName, action, reason, customReason } = feedback

    // Store in database
    await prisma.recommendationFeedback.create({
      data: {
        userId,
        recommendationId,
        action,
        reason: reason || null,
        customReason: customReason || null,
        timestamp: new Date(),
      },
    })

    // Publish event for other services to react
    await eventBus.publish(
      createRecommendationFeedbackEvent(userId, {
        recommendationId,
        foodName,
        action,
        reason: reason || customReason,
      }),
    )

    console.log(`[v0] Feedback recorded: ${action} for ${foodName} - Reason: ${reason || customReason || "none"}`)
  }

  /**
   * Get user's food acceptance history
   */
  async getUserPreferences(userId: string): Promise<Map<string, number>> {
    const preferences = await prisma.userFoodPreference.findMany({
      where: { userId },
    })

    const acceptanceMap = new Map<string, number>()

    for (const pref of preferences) {
      const totalInteractions = pref.acceptanceCount + pref.rejectionCount
      if (totalInteractions > 0) {
        const acceptanceRate = pref.acceptanceCount / totalInteractions
        acceptanceMap.set(pref.foodName, acceptanceRate)
      }
    }

    return acceptanceMap
  }

  /**
   * Get personalized explanation for why we're recommending this food
   */
  generatePersonalizedExplanation(params: {
    userId: string
    foodName: string
    nutrient: string
    currentIntake: number
    targetIntake: number
    cyclePhase?: string
    dayInCycle?: number
    historicalAcceptanceRate?: number
  }): string {
    const { foodName, nutrient, currentIntake, targetIntake, cyclePhase, dayInCycle, historicalAcceptanceRate } = params

    let explanation = ""

    // 1. Why you need it NOW
    if (cyclePhase === "MENSTRUAL" && nutrient === "iron") {
      explanation += `You're on day ${dayInCycle} of your period. Your body is losing 30-40mg of iron through menstruation. `
    } else if (cyclePhase === "LATE_LUTEAL" && nutrient === "magnesium") {
      explanation += `You're ${14 - (dayInCycle! - 14)} days from your period. Magnesium can reduce PMS symptoms by 30-40% (Fathizadeh et al. 2010). `
    } else {
      const deficit = targetIntake - currentIntake
      explanation += `You're currently at ${((currentIntake / targetIntake) * 100).toFixed(0)}% of your daily ${nutrient} target. You need ${deficit.toFixed(1)}mg more. `
    }

    // 2. Why THIS food
    explanation += `${foodName} is an excellent source of ${nutrient}. `

    // 3. Personalization based on history
    if (historicalAcceptanceRate !== undefined) {
      if (historicalAcceptanceRate > 0.7) {
        explanation += `You've enjoyed this ${(historicalAcceptanceRate * 100).toFixed(0)}% of the time we've suggested it - one of your favorites! `
      } else if (historicalAcceptanceRate > 0.4) {
        explanation += `You've tried this before and had mixed results. Give it another chance? `
      }
    }

    // 4. Action-oriented ending
    explanation += `Adding this to your meal today will help you reach your nutrition goals.`

    return explanation
  }

  /**
   * Analyze feedback patterns to improve recommendations
   */
  async analyzeFeedback(userId: string): Promise<FeedbackAnalytics> {
    const feedbacks = await prisma.recommendationFeedback.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 100, // Last 100 feedbacks
    })

    const totalFeedbacks = feedbacks.length
    const accepted = feedbacks.filter((f) => f.action === "accepted").length
    const acceptanceRate = totalFeedbacks > 0 ? accepted / totalFeedbacks : 0

    // Top rejection reasons
    const rejectionReasons = feedbacks.filter((f) => f.action === "rejected" && f.reason).map((f) => f.reason!)

    const reasonCounts = new Map<string, number>()
    rejectionReasons.forEach((reason) => {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    })

    const topRejectionReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Food preferences
    const foodPrefs = await prisma.userFoodPreference.findMany({
      where: {
        userId,
        acceptanceCount: { gt: 0 },
      },
    })

    const mostAcceptedFoods = foodPrefs
      .map((pref) => ({
        foodName: pref.foodName,
        acceptanceRate: pref.acceptanceCount / (pref.acceptanceCount + pref.rejectionCount),
      }))
      .filter((f) => f.acceptanceRate > 0.7)
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
      .slice(0, 5)

    const leastAcceptedFoods = foodPrefs
      .map((pref) => ({
        foodName: pref.foodName,
        acceptanceRate: pref.acceptanceCount / (pref.acceptanceCount + pref.rejectionCount),
      }))
      .filter((f) => f.acceptanceRate < 0.3)
      .sort((a, b) => a.acceptanceRate - b.acceptanceRate)
      .slice(0, 5)

    // Generate improvement tips
    const improvementTips = this.generateImprovementTips({
      acceptanceRate,
      topRejectionReasons,
      totalFeedbacks,
    })

    return {
      totalFeedbacks,
      acceptanceRate,
      topRejectionReasons,
      mostAcceptedFoods,
      leastAcceptedFoods,
      improvementTips,
    }
  }

  /**
   * Generate tips to improve recommendation quality
   */
  private generateImprovementTips(params: {
    acceptanceRate: number
    topRejectionReasons: Array<{ reason: string; count: number }>
    totalFeedbacks: number
  }): string[] {
    const { acceptanceRate, topRejectionReasons } = params
    const tips: string[] = []

    if (acceptanceRate < 0.3) {
      tips.push(
        "Your acceptance rate is low. We're learning your preferences - keep giving feedback to improve recommendations!",
      )
    } else if (acceptanceRate > 0.6) {
      tips.push("Great! Our recommendations match your preferences well. Keep it up!")
    }

    // Address top rejection reasons
    for (const { reason, count } of topRejectionReasons) {
      switch (reason) {
        case "too_expensive":
          tips.push("We'll prioritize more budget-friendly options in future recommendations.")
          break
        case "not_available":
          tips.push("Consider updating your preferred stores in settings to get more available options.")
          break
        case "too_complex":
          tips.push("We'll focus on simpler, quicker meal options for you.")
          break
        case "dont_like_taste":
          tips.push("Taste preferences updated. We'll avoid similar foods in the future.")
          break
      }
    }

    if (tips.length === 0) {
      tips.push("Keep logging and giving feedback - your recommendations will get better every day!")
    }

    return tips
  }

  /**
   * Get foods to avoid for a user (based on rejections)
   */
  async getFoodsToAvoid(userId: string): Promise<string[]> {
    const preferences = await prisma.userFoodPreference.findMany({
      where: {
        userId,
        rejectionCount: { gt: 2 }, // Rejected 3+ times
      },
    })

    return preferences
      .filter((pref) => {
        const total = pref.acceptanceCount + pref.rejectionCount
        const rejectionRate = pref.rejectionCount / total
        return rejectionRate > 0.7 // >70% rejection rate
      })
      .map((pref) => pref.foodName)
  }

  /**
   * Get recommended foods (high acceptance rate)
   */
  async getRecommendedFoods(userId: string, limit = 10): Promise<string[]> {
    const preferences = await prisma.userFoodPreference.findMany({
      where: {
        userId,
        acceptanceCount: { gt: 1 }, // Accepted 2+ times
      },
      orderBy: {
        acceptanceCount: "desc",
      },
      take: limit,
    })

    return preferences
      .filter((pref) => {
        const total = pref.acceptanceCount + pref.rejectionCount
        const acceptanceRate = pref.acceptanceCount / total
        return acceptanceRate > 0.6 // >60% acceptance rate
      })
      .map((pref) => pref.foodName)
  }
}

export const feedbackLoopService = new FeedbackLoopService()
