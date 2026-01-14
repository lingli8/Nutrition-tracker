/**
 * User Journey Types
 * Defines the stages and actions in the user lifecycle
 */

export type OnboardingStep = "WELCOME" | "SET_PROFILE" | "SET_CYCLE" | "FIRST_LOG" | "VIEW_RECOMMENDATIONS" | "COMPLETE"

export type UserJourneyStage = "NEW_USER" | "ONBOARDING" | "ACTIVE" | "ENGAGED" | "POWER_USER" | "AT_RISK"

export interface OnboardingStatus {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  progress: number // 0-100
  nextAction: {
    type: string
    title: string
    description: string
    ctaText: string
    ctaLink: string
  }
}

export interface UserJourneyMetrics {
  daysActive: number
  totalLogs: number
  cycleDataComplete: boolean
  hasReceivedRecommendations: boolean
  recommendationAcceptanceRate: number
  currentStreak: number
  engagementScore: number // 0-100
}

export interface UserJourneyState {
  userId: string
  stage: UserJourneyStage
  onboardingStatus: OnboardingStatus
  metrics: UserJourneyMetrics
  suggestedActions: string[]
  lastUpdated: Date
}
