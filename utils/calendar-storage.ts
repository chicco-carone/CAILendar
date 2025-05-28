import type { CalendarEvent, SerializedCalendarEvent } from "@/utils/types";
import { deserializeEvents, serializeEvents } from "./calendar-context";
import { createCalendarError } from "./ai-errors";

export interface CalendarStorage {
  getEvents(): CalendarEvent[];
  addEvent(event: CalendarEvent): void;
  updateEvent(event: CalendarEvent): void;
  deleteEvent(eventId: string | number): void;
  clear(): void;
}

export class LocalStorageCalendar implements CalendarStorage {
  private readonly storageKey = "calendar-events";
  private readonly metadataKey = "calendar-metadata";

  /**
   * Get all events from localStorage
   */
  getEvents(): CalendarEvent[] {
    try {
      if (typeof window === "undefined") {
        // Server-side rendering - return empty array
        return [];
      }

      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }

      const serializedEvents: SerializedCalendarEvent[] = JSON.parse(stored);
      return deserializeEvents(serializedEvents);
    } catch (error) {
      console.error("Failed to read events from localStorage:", error);
      throw createCalendarError("getEvents", error);
    }
  }

  /**
   * Add a new event to localStorage
   */
  addEvent(event: CalendarEvent): void {
    try {
      const events = this.getEvents();
      events.push(event);
      this.saveEvents(events);
      this.updateMetadata();
    } catch (error) {
      throw createCalendarError("addEvent", error);
    }
  }

  /**
   * Update an existing event in localStorage
   */
  updateEvent(event: CalendarEvent): void {
    try {
      const events = this.getEvents();
      const index = events.findIndex((e) => e.id === event.id);

      if (index === -1) {
        throw new Error(`Event with id ${event.id} not found`);
      }

      events[index] = event;
      this.saveEvents(events);
      this.updateMetadata();
    } catch (error) {
      throw createCalendarError("updateEvent", error);
    }
  }

  /**
   * Delete an event from localStorage
   */
  deleteEvent(eventId: string | number): void {
    try {
      const events = this.getEvents();
      const filteredEvents = events.filter((e) => e.id !== eventId);

      if (filteredEvents.length === events.length) {
        throw new Error(`Event with id ${eventId} not found`);
      }

      this.saveEvents(filteredEvents);
      this.updateMetadata();
    } catch (error) {
      throw createCalendarError("deleteEvent", error);
    }
  }

  /**
   * Clear all events from localStorage
   */
  clear(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.metadataKey);
      }
    } catch (error) {
      throw createCalendarError("clear", error);
    }
  }

  /**
   * Get metadata about stored events
   */
  getMetadata(): { lastModified: Date; eventCount: number } | null {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      const stored = localStorage.getItem(this.metadataKey);
      if (!stored) {
        return null;
      }

      const metadata = JSON.parse(stored);
      return {
        lastModified: new Date(metadata.lastModified),
        eventCount: metadata.eventCount,
      };
    } catch (error) {
      console.error("Failed to read metadata from localStorage:", error);
      return null;
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      if (typeof window === "undefined") {
        return false;
      }

      const test = "localStorage-test";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (typeof window === "undefined" || !this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      const eventsData = localStorage.getItem(this.storageKey) || "";
      const metadataData = localStorage.getItem(this.metadataKey) || "";
      const used = (eventsData.length + metadataData.length) * 2; // Rough estimate in bytes

      // Try to estimate available space (most browsers limit localStorage to ~5-10MB)
      const estimated = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / estimated) * 100;

      return {
        used,
        available: estimated - used,
        percentage: Math.min(percentage, 100),
      };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Export events as JSON
   */
  exportEvents(): string {
    try {
      const events = this.getEvents();
      const serializedEvents = serializeEvents(events);
      return JSON.stringify(serializedEvents, null, 2);
    } catch (error) {
      throw createCalendarError("exportEvents", error);
    }
  }

  /**
   * Import events from JSON
   */
  importEvents(jsonData: string, replaceExisting = false): number {
    try {
      const importedEvents: SerializedCalendarEvent[] = JSON.parse(jsonData);
      const events = deserializeEvents(importedEvents);

      if (replaceExisting) {
        this.saveEvents(events);
      } else {
        const existingEvents = this.getEvents();
        const allEvents = [...existingEvents, ...events];
        this.saveEvents(allEvents);
      }

      this.updateMetadata();
      return events.length;
    } catch (error) {
      throw createCalendarError("importEvents", error);
    }
  }

  /**
   * Private method to save events to localStorage
   */
  private saveEvents(events: CalendarEvent[]): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const serializedEvents = serializeEvents(events);
      const jsonData = JSON.stringify(serializedEvents);

      // Check storage quota before saving
      const storageInfo = this.getStorageInfo();
      const newSize = jsonData.length * 2; // Rough estimate

      if (storageInfo.percentage + (newSize / (5 * 1024 * 1024)) * 100 > 95) {
        throw new Error("Storage quota exceeded. Please clear some events.");
      }

      localStorage.setItem(this.storageKey, jsonData);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "QuotaExceededError" ||
          error.message.includes("quota")
        ) {
          throw new Error("Storage quota exceeded. Please clear some events.");
        }
        throw error;
      }
      throw new Error("Unknown storage error occurred");
    }
  }

  /**
   * Private method to update metadata
   */
  private updateMetadata(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const events = this.getEvents();
      const metadata = {
        lastModified: new Date().toISOString(),
        eventCount: events.length,
      };
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error("Failed to update metadata:", error);
      // Don't throw here, metadata is not critical
    }
  }
}

// Default instance for the app
export const calendarStorage = new LocalStorageCalendar();

/**
 * Get events from the default storage
 */
export function getStoredEvents(): CalendarEvent[] {
  return calendarStorage.getEvents();
}

/**
 * Save events to the default storage
 */
export function saveStoredEvents(events: CalendarEvent[]): void {
  calendarStorage.clear();
  events.forEach((event) => calendarStorage.addEvent(event));
}

/**
 * Check if storage is available and working
 */
export function isStorageAvailable(): boolean {
  return calendarStorage.isAvailable();
}

/**
 * Get events count from storage
 */
export function getStoredEventsCount(): number {
  try {
    const metadata = calendarStorage.getMetadata();
    return metadata?.eventCount || 0;
  } catch {
    return calendarStorage.getEvents().length;
  }
}
