import { initializeEventBus } from "./events/event-setup"

// Initialize event bus on server startup
if (typeof window === "undefined") {
  initializeEventBus()
  console.log("[v0] Event bus initialized on server startup")
}
