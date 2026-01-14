import { prisma } from "@/lib/prisma"
import type { FoodLoggedEvent } from "../event-types"
import { ACHIEVEMENT_XP, STREAK_MILESTONES } from "@/lib/config/nutrition-thresholds"

/**
 * Gamification Event Handlers
 * Handle achievements, streaks, and XP
 */

/**
 * Handle food logged - check for achievements and update streaks
 */
export async function handleFoodLoggedForGamification(event: FoodLoggedEvent): Promise<void> {
  console.log(`[v0] GamificationHandler: Processing food logged for user ${event.userId}`)

  try {
    // Get or create user stats
    let userStats = await prisma.userStats.findUnique({
      where: { userId: event.userId },
    })

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: {
          userId: event.userId,
          totalLogs: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalXp: 0,
          level: 1,
        },
      })
    }

    // Update stats
    const today = new Date().setHours(0, 0, 0, 0)
    const lastLogDate = userStats.lastLogDate ? new Date(userStats.lastLogDate).setHours(0, 0, 0, 0) : 0
    const yesterday = today - 24 * 60 * 60 * 1000

    let newStreak = userStats.currentStreak

    if (lastLogDate === yesterday) {
      // Continued streak
      newStreak++
    } else if (lastLogDate !== today) {
      // New streak or broken streak
      newStreak = 1
    }

    const newLongestStreak = Math.max(userStats.longestStreak, newStreak)

    // Award XP for logging
    let xpGained = ACHIEVEMENT_XP.FIRST_LOG
    if (userStats.totalLogs === 0) {
      // First log ever
      xpGained = ACHIEVEMENT_XP.FIRST_LOG
    } else {
      xpGained = 5 // Base XP per log
    }

    const newTotalXp = userStats.totalXp + xpGained
    const newLevel = Math.floor(newTotalXp / 100) + 1 // Level up every 100 XP

    await prisma.userStats.update({
      where: { userId: event.userId },
      data: {
        totalLogs: userStats.totalLogs + 1,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        totalXp: newTotalXp,
        level: newLevel,
        lastLogDate: new Date(),
      },
    })

    // Check for streak milestone achievements
    if (STREAK_MILESTONES.includes(newStreak)) {
      await checkAndAwardAchievement(event.userId, `STREAK_${newStreak}`, `${newStreak}-Day Streak`, newStreak * 10)
    }

    console.log(`[v0] GamificationHandler: Updated stats. Streak: ${newStreak}, XP: +${xpGained}`)
  } catch (error) {
    console.error("[v0] GamificationHandler: Error updating stats:", error)
  }
}

/**
 * Check and award achievement
 */
async function checkAndAwardAchievement(
  userId: string,
  achievementCode: string,
  achievementName: string,
  xpReward: number,
): Promise<void> {
  // Check if achievement already awarded
  const existing = await prisma.userAchievement.findFirst({
    where: {
      userId,
      achievement: {
        code: achievementCode,
      },
    },
  })

  if (existing) {
    return // Already has this achievement
  }

  // Find or create achievement
  let achievement = await prisma.achievement.findUnique({
    where: { code: achievementCode },
  })

  if (!achievement) {
    achievement = await prisma.achievement.create({
      data: {
        code: achievementCode,
        name: achievementName,
        description: `Achieve a ${achievementName}`,
        iconUrl: "/achievements/streak.svg",
        xpReward,
        rarity: "COMMON",
      },
    })
  }

  // Award achievement
  await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id,
    },
  })

  // Add XP
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalXp: {
        increment: xpReward,
      },
    },
  })

  console.log(`[v0] GamificationHandler: Awarded achievement ${achievementName} to user ${userId}`)
}
