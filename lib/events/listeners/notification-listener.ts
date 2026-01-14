/**
 * Notification Event Listener
 *
 * Sends notifications when interesting events occur
 */

import { eventBus } from "../event-bus"
import type { AchievementUnlockedEvent, PhaseChangedEvent } from "../domain-events"

export function registerNotificationListeners() {
  // Notify on achievement unlock
  eventBus.on("achievement.unlocked", async (event: AchievementUnlockedEvent) => {
    console.log(`[v0] Notification: Achievement unlocked - ${event.data.achievementName}`)

    // In a real app, this would send push notification
    // For now, we'll just log it
    // await sendPushNotification(event.userId, {
    //   title: "Achievement Unlocked!",
    //   body: `You earned: ${event.data.achievementName} (+${event.data.xpEarned} XP)`,
    // });
  })

  // Notify on phase changes
  eventBus.on("cycle.phase_changed", async (event: PhaseChangedEvent) => {
    console.log(`[v0] Notification: Phase changed to ${event.data.newPhase}`)

    const phaseMessages = {
      MENSTRUAL: "Your period has started. Focus on iron-rich foods and rest.",
      FOLLICULAR: "You're in your follicular phase! Great time for high-energy activities.",
      OVULATION: "Peak energy phase! You're at your strongest this week.",
      EARLY_LUTEAL: "Your metabolism is increasing. Add more protein to your meals.",
      LATE_LUTEAL: "PMS may occur soon. Prioritize magnesium and self-care.",
    }

    const message = phaseMessages[event.data.newPhase as keyof typeof phaseMessages]

    // Would send notification in production
    // await sendPushNotification(event.userId, {
    //   title: "Cycle Phase Update",
    //   body: message,
    // });
  })
}
