import type { User, MenstrualCycle } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Edge Case Detection and Handling
 * Identifies and handles special situations that need different treatment
 */

export interface EdgeCaseWarning {
  type: "INFO" | "WARNING" | "HEALTH_NOTE"
  message: string
  action?: {
    text: string
    link: string
  }
}

export class EdgeCaseHandler {
  /**
   * Check if user has cycle data
   */
  async checkCycleDataAvailability(userId: string): Promise<{
    hasData: boolean
    warning?: EdgeCaseWarning
  }> {
    const cycles = await prisma.menstrualCycle.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      take: 1,
    })

    if (cycles.length === 0) {
      return {
        hasData: false,
        warning: {
          type: "INFO",
          message:
            "You haven't logged your menstrual cycle yet. Add cycle data to unlock personalized recommendations based on your hormonal phases.",
          action: {
            text: "Add Cycle Data",
            link: "/menstrual-cycle",
          },
        },
      }
    }

    return { hasData: true }
  }

  /**
   * Check if cycle data is stale (no update in 2+ cycles)
   */
  async checkCycleDataFreshness(cycle: MenstrualCycle): Promise<EdgeCaseWarning | null> {
    const daysSinceStart = Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24))

    const expectedCycles = Math.floor(daysSinceStart / cycle.cycleLength)

    if (expectedCycles >= 2) {
      return {
        type: "WARNING",
        message:
          "Your cycle data hasn't been updated in over 2 cycles. Update your cycle information for more accurate recommendations.",
        action: {
          text: "Update Cycle",
          link: "/menstrual-cycle",
        },
      }
    }

    return null
  }

  /**
   * Check for abnormal cycle length
   */
  checkCycleAbnormality(cycle: MenstrualCycle): EdgeCaseWarning | null {
    // Normal cycle: 21-35 days
    if (cycle.cycleLength < 21 || cycle.cycleLength > 35) {
      return {
        type: "HEALTH_NOTE",
        message: `Your cycle length (${cycle.cycleLength} days) is outside the typical range of 21-35 days. If this persists, consider consulting a healthcare provider. We'll continue to provide recommendations based on your unique cycle.`,
      }
    }

    // Very short period
    if (cycle.periodLength < 2) {
      return {
        type: "HEALTH_NOTE",
        message:
          "Your period duration is unusually short. If this is a recent change, consider consulting a healthcare provider.",
      }
    }

    // Very long period
    if (cycle.periodLength > 7) {
      return {
        type: "HEALTH_NOTE",
        message:
          "Your period duration is longer than typical. If this is accompanied by heavy flow or pain, consider consulting a healthcare provider.",
      }
    }

    return null
  }

  /**
   * Check for potential pregnancy or menopause
   */
  async checkLifeStageChanges(userId: string): Promise<EdgeCaseWarning | null> {
    const recentCycles = await prisma.menstrualCycle.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      take: 3,
    })

    if (recentCycles.length === 0) {
      return null
    }

    const latestCycle = recentCycles[0]
    const daysSinceLastPeriod = Math.floor(
      (Date.now() - new Date(latestCycle.startDate).getTime()) / (1000 * 60 * 60 * 24),
    )

    // Possible pregnancy if 2x normal cycle length
    if (daysSinceLastPeriod > latestCycle.cycleLength * 2) {
      return {
        type: "INFO",
        message:
          "It's been longer than usual since your last period. If you're pregnant or experiencing cycle changes, you can switch to non-cycle-based recommendations.",
        action: {
          text: "Switch Mode",
          link: "/settings",
        },
      }
    }

    return null
  }

  /**
   * Check user profile completeness
   */
  async checkProfileCompleteness(user: User): Promise<EdgeCaseWarning | null> {
    const missingFields: string[] = []

    if (!user.weight) missingFields.push("weight")
    if (!user.height) missingFields.push("height")
    if (!user.activityLevel) missingFields.push("activity level")

    if (missingFields.length > 0) {
      return {
        type: "WARNING",
        message: `Complete your profile (missing: ${missingFields.join(", ")}) for more accurate nutrition recommendations.`,
        action: {
          text: "Complete Profile",
          link: "/profile",
        },
      }
    }

    return null
  }

  /**
   * Check for data gaps (user stopped logging)
   */
  async checkActivityGaps(userId: string): Promise<EdgeCaseWarning | null> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    })

    if (!userStats?.lastLogDate) {
      return {
        type: "INFO",
        message: "Welcome back! Log a meal to continue tracking your nutrition.",
        action: {
          text: "Log a Meal",
          link: "/food-log",
        },
      }
    }

    const daysSinceLastLog = Math.floor(
      (Date.now() - new Date(userStats.lastLogDate).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysSinceLastLog > 7 && daysSinceLastLog < 30) {
      return {
        type: "INFO",
        message:
          "It's been a while since your last log. Don't worry - your data is still here. Pick up where you left off!",
        action: {
          text: "Continue Tracking",
          link: "/food-log",
        },
      }
    }

    if (daysSinceLastLog >= 30) {
      return {
        type: "WARNING",
        message:
          "Your data is over a month old. Recommendations may be less accurate. Start logging again to get fresh insights.",
        action: {
          text: "Start Fresh",
          link: "/food-log",
        },
      }
    }

    return null
  }

  /**
   * Run all edge case checks
   */
  async checkAllEdgeCases(userId: string): Promise<EdgeCaseWarning[]> {
    const warnings: EdgeCaseWarning[] = []

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error("User not found")
      }

      // Check profile completeness
      const profileWarning = await this.checkProfileCompleteness(user)
      if (profileWarning) warnings.push(profileWarning)

      // Check cycle data availability
      const cycleCheck = await this.checkCycleDataAvailability(userId)
      if (!cycleCheck.hasData) {
        if (cycleCheck.warning) warnings.push(cycleCheck.warning)
        return warnings // Skip cycle-specific checks
      }

      // Get latest cycle
      const latestCycle = await prisma.menstrualCycle.findFirst({
        where: { userId },
        orderBy: { startDate: "desc" },
      })

      if (latestCycle) {
        // Check cycle freshness
        const freshnessWarning = await this.checkCycleDataFreshness(latestCycle)
        if (freshnessWarning) warnings.push(freshnessWarning)

        // Check cycle abnormality
        const abnormalityWarning = this.checkCycleAbnormality(latestCycle)
        if (abnormalityWarning) warnings.push(abnormalityWarning)

        // Check life stage changes
        const lifeStageWarning = await this.checkLifeStageChanges(userId)
        if (lifeStageWarning) warnings.push(lifeStageWarning)
      }

      // Check activity gaps
      const activityWarning = await this.checkActivityGaps(userId)
      if (activityWarning) warnings.push(activityWarning)
    } catch (error) {
      console.error("[v0] Error checking edge cases:", error)
    }

    return warnings
  }
}
