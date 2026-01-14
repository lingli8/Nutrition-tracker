import type { AppEvent } from "./event-types"

/**
 * Event Handler
 * Function that processes an event
 */
type EventHandler<T extends AppEvent = AppEvent> = (event: T) => Promise<void> | void

/**
 * Event Bus
 * Central pub/sub system for domain events
 */
class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()
  private eventLog: AppEvent[] = [] // For debugging and replay

  /**
   * Subscribe to an event type
   */
  on<T extends AppEvent>(eventType: T["eventType"], handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler as EventHandler)
    this.handlers.set(eventType, handlers)

    console.log(`[v0] EventBus: Registered handler for ${eventType}`)
  }

  /**
   * Unsubscribe from an event type
   */
  off<T extends AppEvent>(eventType: T["eventType"], handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || []
    const index = handlers.indexOf(handler as EventHandler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  /**
   * Publish an event
   */
  async publish(event: AppEvent): Promise<void> {
    // Log event for debugging
    this.eventLog.push(event)
    console.log(`[v0] EventBus: Publishing ${event.eventType}`, event)

    const handlers = this.handlers.get(event.eventType) || []

    // Execute all handlers (can be async)
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event)
      } catch (error) {
        console.error(`[v0] EventBus: Handler failed for ${event.eventType}:`, error)
      }
    })

    await Promise.all(promises)
  }

  /**
   * Get event history (useful for debugging)
   */
  getEventLog(): AppEvent[] {
    return [...this.eventLog]
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = []
  }
}

// Singleton instance
export const eventBus = new EventBus()
