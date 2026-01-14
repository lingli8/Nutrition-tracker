"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Plus } from "lucide-react"

export default function FoodLogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [mealType, setMealType] = useState("BREAKFAST")
  const [servings, setServings] = useState("1")
  const [todayLogs, setTodayLogs] = useState<any[]>([])

  useEffect(() => {
    fetchTodayLogs()
  }, [])

  const fetchTodayLogs = async () => {
    try {
      const res = await fetch("/api/logs/daily")
      if (res.ok) {
        const logs = await res.json()
        setTodayLogs(logs)
      }
    } catch (error) {
      console.error("[v0] Error fetching logs:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const foods = await res.json()
        setSearchResults(foods)
      }
    } catch (error) {
      toast.error("Failed to search foods")
    }
  }

  const handleLogFood = async () => {
    if (!selectedFood) {
      toast.error("Please select a food")
      return
    }

    try {
      const res = await fetch("/api/logs/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: selectedFood.id,
          mealType,
          servings: Number.parseFloat(servings),
        }),
      })

      if (res.ok) {
        toast.success("Food logged successfully!")
        setSelectedFood(null)
        setSearchQuery("")
        setSearchResults([])
        fetchTodayLogs()
      } else {
        toast.error("Failed to log food")
      }
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  const totalCalories = todayLogs.reduce((sum, log) => sum + log.food.calories * log.servings, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Food Log</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Log Food Card */}
          <Card>
            <CardHeader>
              <CardTitle>Log a Meal</CardTitle>
              <CardDescription>Search and add foods to your daily log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg p-2 max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((food) => (
                    <div
                      key={food.id}
                      className={`p-3 rounded cursor-pointer hover:bg-accent ${selectedFood?.id === food.id ? "bg-accent" : ""}`}
                      onClick={() => setSelectedFood(food)}
                    >
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {food.calories} cal | {food.protein}g protein | {food.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedFood && (
                <>
                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <Select value={mealType} onValueChange={setMealType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                        <SelectItem value="LUNCH">Lunch</SelectItem>
                        <SelectItem value="DINNER">Dinner</SelectItem>
                        <SelectItem value="SNACK">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Servings</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleLogFood} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Food
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Nutrition</CardTitle>
              <CardDescription>Total calories: {Math.round(totalCalories)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No meals logged yet today</p>
                ) : (
                  todayLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{log.food.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.mealType} • {log.servings} serving(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{Math.round(log.food.calories * log.servings)} cal</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(log.food.protein * log.servings)}g protein
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
