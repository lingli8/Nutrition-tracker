/**
 * Gamification Event Listener
 *
 * Listens to various events and awards achievements/XP
 */

import { eventBus } from "../event-bus"
import type { FoodLoggedEvent, GoalReachedEvent } from "../domain-events"
import { prisma } from "@/lib/prisma"
import { createAchievementUnlockedEvent } from "../domain-events"

export function registerGamificationListeners() {
  // Check for logging streaks
  eventBus.on("food.logged", async (event: FoodLoggedEvent) => {
    console.log(`[v0] Gamification: Checking achievements for food log`)

    const userStats = await prisma.userStats.findUnique({
      where: { userId: event.userId },
    })

    if (!userStats) return

    // Check streak achievements
    const streakMilestones = [3, 7, 14, 30, 60, 90]
    if (streakMilestones.includes(userStats.currentStreak)) {
      const achievementName = `${userStats.currentStreak}-Day Streak`

      // Check if already unlocked
      const existing = await prisma.userAchievement.findFirst({
        where: {
          userId: event.userId,
          achievement: {
            name: achievementName,
          },
        },
      })

      if (!existing) {
        // Create achievement if doesn't exist
        let achievement = await prisma.achievement.findFirst({
          where: { name: achievementName },
        })

        if (!achievement) {
          achievement = await prisma.achievement.create({
            data: {
              name: achievementName,
              description: `Logged your nutrition for ${userStats.currentStreak} consecutive days`,
              category: "CONSISTENCY",
              rarity: userStats.currentStreak >= 30 ? "EPIC" : userStats.currentStreak >= 14 ? "RARE" : "COMMON",
              xpReward: userStats.currentStreak * 10,
            },
          })
        }

        // Unlock achievement
        await prisma.userAchievement.create({
          data: {
            userId: event.userId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
          },
        })

        // Publish achievement event
        eventBus.publish(
          createAchievementUnlockedEvent(event.userId, {
            achievementId: achievement.id,
            achievementName: achievement.name,
            category: achievement.category,
            xpEarned: achievement.xpReward,
          }),
        )
      }
    }
  })

  // Celebrate goal achievements
  eventBus.on("goal.reached", async (event: GoalReachedEvent) => {
    console.log(`[v0] Gamification: Goal reached - ${event.data.goalType}`)

    // Award XP for reaching goals
    await prisma.userStats.update({
      where: { userId: event.userId },
      data: {
        totalXp: { increment: 50 },
      },
    })
  })
}
