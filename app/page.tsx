import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-balance">Nutrition Tracker</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
            Advanced cycle-aware nutrition tracking powered by Stacy Sims research with AI-driven personalization
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
        {/* </CHANGE> */}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">Stacy Sims Protocol</h3>
            <p className="text-muted-foreground">
              5-phase menstrual cycle tracking with evidence-based macronutrient ratios, training recommendations, and
              micronutrient protocols
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">AI Personalization</h3>
            <p className="text-muted-foreground">
              Memory-based learning system that adapts recommendations based on your preferences, achieving 60-70%
              acceptance rates
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground">
              Cycle overlay charts, symptom heatmaps, predictive insights, and streak tracking for comprehensive health
              monitoring
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">Smart Meal Planning</h3>
            <p className="text-muted-foreground">
              Automated weekly meal plans based on cycle phase, nutrient needs, and preferences with shopping lists
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">Gamification System</h3>
            <p className="text-muted-foreground">
              Achievement system with badges, experience points, leveling, leaderboards, and cycle-specific support
              groups
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">PWA Support</h3>
            <p className="text-muted-foreground">
              Progressive web app capabilities with offline support, mobile-first design, and native app feel
            </p>
          </div>
        </div>
        {/* </CHANGE> */}

        <div className="bg-card rounded-lg shadow-xl p-8 mb-8 border">
          <h2 className="text-3xl font-bold mb-6">Project Architecture</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Core Technology</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Next.js 16 with App Router</li>
                <li>TypeScript for type safety</li>
                <li>Prisma ORM with PostgreSQL/MySQL</li>
                <li>NextAuth.js authentication</li>
                <li>Tailwind CSS styling</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Event-driven architecture</li>
                <li>Strategy pattern recommendations</li>
                <li>Data-driven configuration</li>
                <li>User journey tracking</li>
                <li>Edge case handling</li>
              </ul>
            </div>
          </div>
        </div>
        {/* </CHANGE> */}

        <div className="bg-muted/30 rounded-lg p-8 border">
          <h2 className="text-2xl font-bold mb-4">Documentation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/API_DOCUMENTATION.md"
              className="p-4 bg-card rounded-lg hover:shadow-md transition-shadow border"
            >
              <div className="font-semibold mb-1">API Documentation</div>
              <div className="text-sm text-muted-foreground">Complete REST API reference</div>
            </Link>
            <Link
              href="/TECHNICAL_DOCUMENTATION.md"
              className="p-4 bg-card rounded-lg hover:shadow-md transition-shadow border"
            >
              <div className="font-semibold mb-1">Technical Documentation</div>
              <div className="text-sm text-muted-foreground">Architecture and implementation details</div>
            </Link>
            <Link
              href="/STACY_SIMS_IMPLEMENTATION.md"
              className="p-4 bg-card rounded-lg hover:shadow-md transition-shadow border"
            >
              <div className="font-semibold mb-1">Stacy Sims Implementation</div>
              <div className="text-sm text-muted-foreground">Research-backed cycle protocols</div>
            </Link>
            <Link
              href="/PERSONALIZATION_SYSTEM.md"
              className="p-4 bg-card rounded-lg hover:shadow-md transition-shadow border"
            >
              <div className="font-semibold mb-1">Personalization System</div>
              <div className="text-sm text-muted-foreground">AI-driven recommendation engine</div>
            </Link>
          </div>
        </div>
        {/* </CHANGE> */}
      </div>
    </div>
  )
}
