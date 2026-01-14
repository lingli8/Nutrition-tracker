"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Award, Activity } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  currentPhase: string
  recommendations: any
  todayLogs: any[]
  stats: any
  goals: any
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [phaseRes, logsRes, statsRes, recsRes] = await Promise.all([
          fetch("/api/menstrual/current-phase"),
          fetch("/api/logs/daily"),
          fetch("/api/stats"),
          fetch("/api/nutrition/recommendations"),
        ])

        const [phase, logs, stats, recs] = await Promise.all([
          phaseRes.ok ? phaseRes.json() : null,
          logsRes.ok ? logsRes.json() : [],
          statsRes.ok ? statsRes.json() : null,
          recsRes.ok ? recsRes.json() : null,
        ])

        setData({
          currentPhase: phase?.phase || "UNKNOWN",
          recommendations: phase?.recommendations,
          todayLogs: logs,
          stats,
          goals: recs?.goals,
        })
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const phaseColors: Record<string, string> = {
    MENSTRUAL: "bg-red-500",
    FOLLICULAR: "bg-green-500",
    OVULATION: "bg-yellow-500",
    LUTEAL_EARLY: "bg-orange-500",
    LUTEAL_LATE: "bg-purple-500",
  }

  const todayCalories =
    data?.todayLogs.reduce((sum, log) => {
      return sum + (log.food.calories * log.servings || 0)
    }, 0) || 0

  const calorieProgress = data?.goals ? (todayCalories / data.goals.calories) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {session?.user?.name || "User"}!</h1>
          <p className="text-muted-foreground">Track your nutrition based on your cycle phase</p>
        </div>

        {/* Current Phase Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Cycle Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full ${phaseColors[data?.currentPhase || "MENSTRUAL"]}`}></div>
                <div>
                  <p className="text-2xl font-bold">{data?.currentPhase?.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.recommendations?.trainingRecommendations?.[0] || "Track your cycle to get recommendations"}
                  </p>
                </div>
              </div>
              {!data?.currentPhase && (
                <Link href="/cycle">
                  <Button className="w-full">Log Your Cycle</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Calories Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{Math.round(todayCalories)}</div>
              <div className="text-sm text-muted-foreground mb-2">Goal: {data?.goals?.calories || 2000}</div>
              <Progress value={Math.min(calorieProgress, 100)} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{data?.stats?.currentStreak || 0}</div>
              <div className="text-sm text-muted-foreground">Longest: {data?.stats?.longestStreak || 0} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Goals */}
        {data?.goals && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Daily Nutrition Goals</CardTitle>
              <CardDescription>Based on your {data.currentPhase} phase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Protein</span>
                    <span className="text-sm text-muted-foreground">{data.goals.protein}g</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Carbs</span>
                    <span className="text-sm text-muted-foreground">{data.goals.carbs}g</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Fat</span>
                    <span className="text-sm text-muted-foreground">{data.goals.fat}g</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Nutrients */}
        {data?.recommendations?.keyNutrients && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Focus Nutrients for This Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.recommendations.keyNutrients.map((nutrient: string) => (
                  <div key={nutrient} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {nutrient}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/food-log">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Log a Meal</CardTitle>
                <CardDescription>Track your daily nutrition</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/cycle">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Update Cycle</CardTitle>
                <CardDescription>Track menstrual phase</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>View Analytics</CardTitle>
                <CardDescription>See your progress</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
