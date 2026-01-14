"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Calendar, Apple, BarChart3, Users, User, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r hidden md:block">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">Nutrition Tracker</h2>
          <p className="text-sm text-muted-foreground">Cycle-aware nutrition</p>
        </div>
        <nav className="space-y-1 px-3">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/food-log">
            <Button variant="ghost" className="w-full justify-start">
              <Apple className="mr-2 h-4 w-4" />
              Food Log
            </Button>
          </Link>
          <Link href="/cycle">
            <Button variant="ghost" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Cycle Tracking
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/community">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Community
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <Button variant="ghost" className="w-full justify-start" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
