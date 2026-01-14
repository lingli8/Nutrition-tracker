import { prisma } from "./prisma"
import { hash } from "bcryptjs"

export async function seedDatabase() {
  // Create sample user
  const hashedPassword = await hash("password123", 12)

  const user = await prisma.user.create({
    data: {
      email: "demo@nutrition.com",
      password: hashedPassword,
      name: "Demo User",
      age: 28,
      weight: 65,
      height: 165,
      activityLevel: "MODERATE",
    },
  })

  // Create sample foods
  const foods = await prisma.food.createMany({
    data: [
      {
        name: "Chicken Breast",
        category: "PROTEIN",
        calories: 165,
        protein: 31,
        carbohydrates: 0,
        fat: 3.6,
        fiber: 0,
        iron: 0.9,
        servingSize: "100",
        servingUnit: "g",
      },
      {
        name: "Brown Rice",
        category: "GRAINS",
        calories: 112,
        protein: 2.6,
        carbohydrates: 24,
        fat: 0.9,
        fiber: 1.8,
        magnesium: 43,
        servingSize: "100",
        servingUnit: "g",
      },
      {
        name: "Spinach",
        category: "VEGETABLES",
        calories: 23,
        protein: 2.9,
        carbohydrates: 3.6,
        fat: 0.4,
        fiber: 2.2,
        iron: 2.7,
        calcium: 99,
        folate: 194,
        servingSize: "100",
        servingUnit: "g",
      },
    ],
  })

  // Create achievements
  await prisma.achievement.createMany({
    data: [
      {
        name: "First Step",
        description: "Log your first meal",
        category: "LOGGING",
        rarity: "COMMON",
        requiredValue: 1,
      },
      {
        name: "Week Warrior",
        description: "Log meals for 7 consecutive days",
        category: "STREAKS",
        rarity: "RARE",
        requiredValue: 7,
      },
      {
        name: "Iron Champion",
        description: "Meet iron goals for 7 days",
        category: "NUTRITION",
        rarity: "EPIC",
        requiredValue: 7,
      },
    ],
  })

  console.log("Database seeded successfully!")
}
