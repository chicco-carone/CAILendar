import type { CalendarEvent, SerializedCalendarEvent } from "@/utils/types";
import {
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from "date-fns";
import { createCalendarError } from "./ai-errors";

export interface CalendarContextOptions {
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  includeDetails?: boolean;
  maxEvents?: number;
}

export interface EventConflict {
  newEvent: CalendarEvent;
  conflictingEvents: CalendarEvent[];
  overlapType: "partial" | "complete" | "surrounding";
  suggestion?: string;
}

export interface CalendarContextSummary {
  totalEvents: number;
  busyPeriods: Array<{
    start: Date;
    end: Date;
    title: string;
  }>;
  availableSlots: Array<{
    start: Date;
    end: Date;
    duration: number; // in minutes
  }>;
  timezone: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export class CalendarContextReader {
  private events: CalendarEvent[] = [];
  private lastUpdate: Date = new Date(0);
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(private getEventsFromStorage: () => CalendarEvent[] = () => []) {}

  /**
   * Update the internal events cache
   */
  updateEvents(events: CalendarEvent[]): void {
    this.events = events;
    this.lastUpdate = new Date();
  }

  /**
   * Get events in the specified date range
   */
  getEventsInRange(options: CalendarContextOptions = {}): CalendarEvent[] {
    try {
      this.refreshCacheIfNeeded();

      const {
        startDate = new Date(),
        endDate = addDays(new Date(), 30),
        maxEvents = 100,
      } = options;

      const filteredEvents = this.events.filter((event) => {
        const eventStart = event.startDate;
        const eventEnd = event.endDate;

        // Check if event overlaps with the requested range
        return (
          (isAfter(eventStart, startDate) || isAfter(eventEnd, startDate)) &&
          (isBefore(eventStart, endDate) || isBefore(eventEnd, endDate))
        );
      });

      // Sort by start date and limit results
      return filteredEvents
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .slice(0, maxEvents);
    } catch (error) {
      throw createCalendarError("getEventsInRange", error);
    }
  }

  /**
   * Get conflicting events for proposed new events
   */
  getConflictingEvents(proposedEvents: CalendarEvent[]): EventConflict[] {
    try {
      this.refreshCacheIfNeeded();
      const conflicts: EventConflict[] = [];

      for (const newEvent of proposedEvents) {
        const conflictingEvents = this.events.filter((existingEvent) =>
          this.eventsOverlap(newEvent, existingEvent),
        );

        if (conflictingEvents.length > 0) {
          conflicts.push({
            newEvent,
            conflictingEvents,
            overlapType: this.getOverlapType(newEvent, conflictingEvents),
            suggestion: this.generateConflictSuggestion(
              newEvent,
              conflictingEvents,
            ),
          });
        }
      }

      return conflicts;
    } catch (error) {
      throw createCalendarError("getConflictingEvents", error);
    }
  }

  /**
   * Get available time slots on a specific date
   */
  getAvailableTimeSlots(
    date: Date,
    durationMinutes: number,
  ): Array<{ start: Date; end: Date; duration: number }> {
    try {
      this.refreshCacheIfNeeded();

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Get events for this day
      const dayEvents = this.events
        .filter((event) => {
          const eventDate = startOfDay(event.startDate);
          return eventDate.getTime() === dayStart.getTime();
        })
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      const availableSlots: Array<{
        start: Date;
        end: Date;
        duration: number;
      }> = [];

      // Working hours: 9 AM to 6 PM
      const workStart = new Date(dayStart);
      workStart.setHours(9, 0, 0, 0);
      const workEnd = new Date(dayStart);
      workEnd.setHours(18, 0, 0, 0);

      let currentTime = workStart;

      for (const event of dayEvents) {
        const eventStart = event.startDate;
        const eventEnd = event.endDate;

        // Check if there's a gap before this event
        if (eventStart > currentTime) {
          const gapDuration =
            (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);

          if (gapDuration >= durationMinutes) {
            availableSlots.push({
              start: new Date(currentTime),
              end: new Date(eventStart),
              duration: gapDuration,
            });
          }
        }

        // Move current time to after this event
        currentTime = eventEnd > currentTime ? eventEnd : currentTime;
      }

      // Check for time after the last event
      if (currentTime < workEnd) {
        const remainingDuration =
          (workEnd.getTime() - currentTime.getTime()) / (1000 * 60);

        if (remainingDuration >= durationMinutes) {
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(workEnd),
            duration: remainingDuration,
          });
        }
      }

      return availableSlots;
    } catch (error) {
      throw createCalendarError("getAvailableTimeSlots", error);
    }
  }

  /**
   * Format events for AI context
   */
  formatEventsForAI(options: CalendarContextOptions = {}): string {
    try {
      const events = this.getEventsInRange(options);

      if (events.length === 0) {
        return "No existing events in the specified time range.";
      }

      const { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone } =
        options;

      const formattedEvents = events.map((event) => {
        const startStr = format(event.startDate, "yyyy-MM-dd HH:mm");
        const endStr = format(event.endDate, "yyyy-MM-dd HH:mm");
        const duration = Math.round(
          (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60),
        );

        return `- ${event.title} (${startStr} to ${endStr}, ${duration}min)${
          event.location ? ` at ${event.location}` : ""
        }${event.description ? ` - ${event.description}` : ""}`;
      });

      return `Existing calendar events (timezone: ${timezone}):\n${formattedEvents.join("\n")}`;
    } catch (error) {
      throw createCalendarError("formatEventsForAI", error);
    }
  }

  /**
   * Get a summary of calendar context
   */
  getCalendarSummary(
    options: CalendarContextOptions = {},
  ): CalendarContextSummary {
    try {
      const events = this.getEventsInRange(options);
      const {
        startDate = new Date(),
        endDate = addDays(new Date(), 30),
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
      } = options;

      const busyPeriods = events.map((event) => ({
        start: event.startDate,
        end: event.endDate,
        title: event.title,
      }));

      // Calculate available slots for the next 7 days
      const availableSlots: Array<{
        start: Date;
        end: Date;
        duration: number;
      }> = [];
      for (let i = 0; i < 7; i++) {
        const checkDate = addDays(startDate, i);
        const daySlots = this.getAvailableTimeSlots(checkDate, 30); // 30-minute minimum slots
        availableSlots.push(...daySlots);
      }

      return {
        totalEvents: events.length,
        busyPeriods,
        availableSlots: availableSlots.slice(0, 20), // Limit to first 20 slots
        timezone,
        dateRange: { start: startDate, end: endDate },
      };
    } catch (error) {
      throw createCalendarError("getCalendarSummary", error);
    }
  }

  /**
   * Check if cache needs refresh
   */
  private refreshCacheIfNeeded(): void {
    const now = new Date();
    const timeSinceUpdate = now.getTime() - this.lastUpdate.getTime();

    if (timeSinceUpdate > this.cacheTimeout) {
      try {
        const freshEvents = this.getEventsFromStorage();
        this.updateEvents(freshEvents);
      } catch (error) {
        console.warn("Failed to refresh events cache:", error);
        // Continue with stale cache rather than failing
      }
    }
  }

  /**
   * Check if two events overlap
   */
  private eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    return (
      event1.startDate < event2.endDate && event1.endDate > event2.startDate
    );
  }

  /**
   * Determine the type of overlap between events
   */
  private getOverlapType(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
  ): "partial" | "complete" | "surrounding" {
    for (const existing of conflictingEvents) {
      // Check if new event is completely within existing event
      if (
        newEvent.startDate >= existing.startDate &&
        newEvent.endDate <= existing.endDate
      ) {
        return "complete";
      }

      // Check if new event completely surrounds existing event
      if (
        newEvent.startDate <= existing.startDate &&
        newEvent.endDate >= existing.endDate
      ) {
        return "surrounding";
      }
    }

    return "partial";
  }

  /**
   * Generate a suggestion for resolving conflicts
   */
  private generateConflictSuggestion(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
  ): string {
    const duration = newEvent.endDate.getTime() - newEvent.startDate.getTime();
    const eventDate = startOfDay(newEvent.startDate);

    // Try to find available slots on the same day
    const availableSlots = this.getAvailableTimeSlots(
      eventDate,
      duration / (1000 * 60),
    );

    if (availableSlots.length > 0) {
      const bestSlot = availableSlots[0];
      const suggestedTime = format(bestSlot.start, "HH:mm");
      return `Consider scheduling at ${suggestedTime} instead`;
    }

    // Suggest next available day
    const nextDay = addDays(eventDate, 1);
    const nextDaySlots = this.getAvailableTimeSlots(
      nextDay,
      duration / (1000 * 60),
    );

    if (nextDaySlots.length > 0) {
      const nextDayTime = format(nextDaySlots[0].start, "MMM dd, HH:mm");
      return `Consider scheduling on ${nextDayTime}`;
    }

    return "Consider adjusting the time to avoid conflicts";
  }
}

// Utility functions for serialized events
export function deserializeEvents(
  serializedEvents: SerializedCalendarEvent[],
): CalendarEvent[] {
  return serializedEvents.map((event) => ({
    ...event,
    startDate: parseISO(event.startDate),
    endDate: parseISO(event.endDate),
  }));
}

export function serializeEvents(
  events: CalendarEvent[],
): SerializedCalendarEvent[] {
  return events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  }));
}

// Default instance that can be used throughout the app
export const calendarContext = new CalendarContextReader();
