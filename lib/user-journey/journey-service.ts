import { prisma } from "@/lib/prisma"
import type { OnboardingStatus, OnboardingStep, UserJourneyStage, UserJourneyMetrics } from "./journey-types"

/**
 * User Journey Service
 * Tracks and guides users through their lifecycle
 */
export class UserJourneyService {
  /**
   * Get onboarding status for a user
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        menstrualCycles: true,
        dailyLogs: true,
        userFoodPreferences: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const completedSteps: OnboardingStep[] = ["WELCOME"]

    // Check profile completion
    if (user.weight && user.height && user.activityLevel) {
      completedSteps.push("SET_PROFILE")
    }

    // Check cycle data
    if (user.menstrualCycles.length > 0) {
      completedSteps.push("SET_CYCLE")
    }

    // Check first log
    if (user.dailyLogs.length > 0) {
      completedSteps.push("FIRST_LOG")
    }

    // Check if viewed recommendations
    if (user.userFoodPreferences.length > 0) {
      completedSteps.push("VIEW_RECOMMENDATIONS")
    }

    // Determine current step
    let currentStep: OnboardingStep = "COMPLETE"
    if (!completedSteps.includes("SET_PROFILE")) {
      currentStep = "SET_PROFILE"
    } else if (!completedSteps.includes("SET_CYCLE")) {
      currentStep = "SET_CYCLE"
    } else if (!completedSteps.includes("FIRST_LOG")) {
      currentStep = "FIRST_LOG"
    } else if (!completedSteps.includes("VIEW_RECOMMENDATIONS")) {
      currentStep = "VIEW_RECOMMENDATIONS"
    }

    const progress = (completedSteps.length / 5) * 100

    const nextAction = this.determineNextAction(currentStep, user)

    return {
      currentStep,
      completedSteps,
      progress,
      nextAction,
    }
  }

  /**
   * Determine next action for user
   */
  private determineNextAction(currentStep: OnboardingStep, user: any): OnboardingStatus["nextAction"] {
    switch (currentStep) {
      case "SET_PROFILE":
        return {
          type: "COMPLETE_PROFILE",
          title: "Complete Your Profile",
          description: "Tell us about yourself to get personalized nutrition recommendations",
          ctaText: "Set Up Profile",
          ctaLink: "/profile",
        }

      case "SET_CYCLE":
        return {
          type: "SET_CYCLE",
          title: "Track Your Cycle",
          description:
            "Enable cycle-aware nutrition by logging your menstrual cycle. Get recommendations that adapt to your hormones.",
          ctaText: "Add Cycle Data",
          ctaLink: "/menstrual-cycle",
        }

      case "FIRST_LOG":
        return {
          type: "LOG_MEAL",
          title: "Log Your First Meal",
          description: "Start tracking your nutrition to see personalized insights and recommendations",
          ctaText: "Log a Meal",
          ctaLink: "/food-log",
        }

      case "VIEW_RECOMMENDATIONS":
        return {
          type: "VIEW_RECOMMENDATIONS",
          title: "Check Your Recommendations",
          description: "See personalized food suggestions based on your cycle phase and nutrition gaps",
          ctaText: "View Recommendations",
          ctaLink: "/dashboard",
        }

      case "COMPLETE":
        return {
          type: "BUILD_HABIT",
          title: "Build Your Streak",
          description: "Log meals daily to build a streak and unlock achievements",
          ctaText: "Continue Logging",
          ctaLink: "/food-log",
        }

      default:
        return {
          type: "EXPLORE",
          title: "Explore Features",
          description: "Discover meal planning, community, and advanced analytics",
          ctaText: "Explore",
          ctaLink: "/dashboard",
        }
    }
  }

  /**
   * Get user journey stage
   */
  async getUserJourneyStage(userId: string): Promise<UserJourneyStage> {
    const metrics = await this.getUserMetrics(userId)

    // New user - less than 3 days active
    if (metrics.daysActive < 3) {
      return "NEW_USER"
    }

    // Onboarding - incomplete profile or no cycle data
    if (!metrics.cycleDataComplete) {
      return "ONBOARDING"
    }

    // At risk - no activity in last 7 days
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    })

    if (userStats?.lastLogDate) {
      const daysSinceLastLog = Math.floor(
        (Date.now() - new Date(userStats.lastLogDate).getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysSinceLastLog > 7) {
        return "AT_RISK"
      }
    }

    // Power user - high engagement
    if (metrics.engagementScore > 70) {
      return "POWER_USER"
    }

    // Engaged - regular user
    if (metrics.currentStreak >= 7) {
      return "ENGAGED"
    }

    // Active - regular logging but not highly engaged
    return "ACTIVE"
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(userId: string): Promise<UserJourneyMetrics> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        menstrualCycles: true,
        dailyLogs: {
          orderBy: { date: "desc" },
        },
        userFoodPreferences: true,
        recommendationFeedbacks: true,
        userStats: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Calculate days active
    const firstLog = user.dailyLogs[user.dailyLogs.length - 1]
    const daysActive = firstLog
      ? Math.floor((Date.now() - new Date(firstLog.date).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Check cycle data completeness
    const cycleDataComplete = user.menstrualCycles.length > 0

    // Calculate recommendation acceptance rate
    const totalFeedbacks = user.recommendationFeedbacks.length
    const acceptedFeedbacks = user.recommendationFeedbacks.filter((f) => f.action === "ACCEPTED").length
    const recommendationAcceptanceRate = totalFeedbacks > 0 ? acceptedFeedbacks / totalFeedbacks : 0

    // Calculate engagement score
    const logsPerDay = daysActive > 0 ? user.dailyLogs.length / daysActive : 0
    const streakScore = Math.min((user.userStats?.currentStreak || 0) * 2, 40)
    const acceptanceScore = recommendationAcceptanceRate * 30
    const activityScore = Math.min(logsPerDay * 30, 30)

    const engagementScore = streakScore + acceptanceScore + activityScore

    return {
      daysActive,
      totalLogs: user.dailyLogs.length,
      cycleDataComplete,
      hasReceivedRecommendations: user.userFoodPreferences.length > 0,
      recommendationAcceptanceRate,
      currentStreak: user.userStats?.currentStreak || 0,
      engagementScore: Math.round(engagementScore),
    }
  }

  /**
   * Get suggested actions for user based on their stage
   */
  async getSuggestedActions(userId: string): Promise<string[]> {
    const stage = await this.getUserJourneyStage(userId)
    const metrics = await this.getUserMetrics(userId)

    const actions: string[] = []

    switch (stage) {
      case "NEW_USER":
        actions.push("Complete your profile for personalized recommendations")
        actions.push("Log your first meal to start tracking")
        break

      case "ONBOARDING":
        if (!metrics.cycleDataComplete) {
          actions.push("Add your menstrual cycle data for cycle-aware nutrition")
        }
        actions.push("Explore the dashboard to see your nutrition trends")
        break

      case "ACTIVE":
        actions.push("Build a 7-day streak to unlock achievements")
        actions.push("Try the meal planner to simplify your nutrition")
        break

      case "ENGAGED":
        actions.push("Share your progress in the community")
        actions.push("Explore advanced analytics to optimize your nutrition")
        break

      case "POWER_USER":
        actions.push("Invite friends to join and compete on leaderboards")
        actions.push("Customize your nutrition goals for specific training phases")
        break

      case "AT_RISK":
        actions.push("Log a meal today to continue your progress")
        actions.push("Check your personalized recommendations")
        break
    }

    return actions
  }
}
