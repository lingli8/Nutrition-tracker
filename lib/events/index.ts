/**
 * Event System Entry Point
 *
 * Initialize all event listeners here
 */

import { registerPersonalizationListeners } from "./listeners/personalization-listener"
import { registerGamificationListeners } from "./listeners/gamification-listener"
import { registerNotificationListeners } from "./listeners/notification-listener"

let initialized = false

export function initializeEventSystem() {
  if (initialized) {
    console.log("[v0] Event system already initialized")
    return
  }

  console.log("[v0] Initializing event-driven architecture...")

  // Register all listeners
  registerPersonalizationListeners()
  registerGamificationListeners()
  registerNotificationListeners()

  initialized = true
  console.log("[v0] Event system initialized successfully")
}

// Export event bus for publishing events
export { eventBus } from "./event-bus"
export * from "./domain-events"
