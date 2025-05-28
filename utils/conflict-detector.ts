import type { CalendarEvent } from "@/utils/types";
import type { EventConflict } from "./calendar-context";
import {
  format,
  addMinutes,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { createCalendarError } from "./ai-errors";

export interface ConflictDetectionOptions {
  bufferMinutes?: number; // Buffer time between events
  workingHours?: {
    start: number; // Hour (0-23)
    end: number; // Hour (0-23)
  };
  ignoreWeekends?: boolean;
  timezone?: string;
}

export interface ConflictSuggestion {
  type: "time_adjustment" | "date_change" | "duration_change" | "split_event";
  description: string;
  suggestedTime?: Date;
  suggestedEndTime?: Date;
  reason: string;
}

export interface DetailedConflict extends EventConflict {
  conflictDuration: number; // in minutes
  conflictPercentage: number; // 0-100
  suggestions: ConflictSuggestion[];
  severity: "low" | "medium" | "high";
}

export class ConflictDetector {
  private options: Required<ConflictDetectionOptions>;

  constructor(options: ConflictDetectionOptions = {}) {
    this.options = {
      bufferMinutes: options.bufferMinutes || 15,
      workingHours: options.workingHours || { start: 9, end: 18 },
      ignoreWeekends: options.ignoreWeekends || false,
      timezone:
        options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Detect conflicts between new events and existing events
   */
  detectSchedulingConflicts(
    newEvents: CalendarEvent[],
    existingEvents: CalendarEvent[],
  ): DetailedConflict[] {
    try {
      const conflicts: DetailedConflict[] = [];

      for (const newEvent of newEvents) {
        const eventConflicts = this.findConflictsForEvent(
          newEvent,
          existingEvents,
        );

        if (eventConflicts.length > 0) {
          const conflict = this.analyzeConflict(newEvent, eventConflicts);
          conflicts.push(conflict);
        }
      }

      return conflicts;
    } catch (error) {
      throw createCalendarError("detectSchedulingConflicts", error);
    }
  }

  /**
   * Find all conflicts for a single event
   */
  private findConflictsForEvent(
    newEvent: CalendarEvent,
    existingEvents: CalendarEvent[],
  ): CalendarEvent[] {
    const conflicts: CalendarEvent[] = [];

    for (const existing of existingEvents) {
      if (this.eventsConflict(newEvent, existing)) {
        conflicts.push(existing);
      }
    }

    return conflicts;
  }

  /**
   * Check if two events conflict (with buffer time)
   */
  private eventsConflict(
    event1: CalendarEvent,
    event2: CalendarEvent,
  ): boolean {
    const buffer = this.options.bufferMinutes;

    // Add buffer to event times
    const event1Start = addMinutes(event1.startDate, -buffer);
    const event1End = addMinutes(event1.endDate, buffer);
    const event2Start = addMinutes(event2.startDate, -buffer);
    const event2End = addMinutes(event2.endDate, buffer);

    // Check for overlap
    return event1Start < event2End && event1End > event2Start;
  }

  /**
   * Analyze conflict details and generate suggestions
   */
  private analyzeConflict(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
  ): DetailedConflict {
    const overlapType = this.getOverlapType(newEvent, conflictingEvents);
    const conflictDuration = this.calculateConflictDuration(
      newEvent,
      conflictingEvents,
    );
    const conflictPercentage = this.calculateConflictPercentage(
      newEvent,
      conflictingEvents,
    );
    const severity = this.calculateSeverity(
      conflictPercentage,
      conflictingEvents.length,
    );
    const suggestions = this.generateConflictSuggestions(
      newEvent,
      conflictingEvents,
    );

    return {
      newEvent,
      conflictingEvents,
      overlapType,
      conflictDuration,
      conflictPercentage,
      suggestions,
      severity,
      suggestion:
        suggestions[0]?.description ||
        "Consider adjusting the time to avoid conflicts",
    };
  }

  /**
   * Determine the type of overlap
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
   * Calculate total conflict duration in minutes
   */
  private calculateConflictDuration(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
  ): number {
    let totalConflictMinutes = 0;

    for (const existing of conflictingEvents) {
      const overlapStart = new Date(
        Math.max(newEvent.startDate.getTime(), existing.startDate.getTime()),
      );
      const overlapEnd = new Date(
        Math.min(newEvent.endDate.getTime(), existing.endDate.getTime()),
      );

      if (overlapEnd > overlapStart) {
        totalConflictMinutes +=
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
      }
    }

    return Math.round(totalConflictMinutes);
  }

  /**
   * Calculate conflict percentage
   */
  private calculateConflictPercentage(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
  ): number {
    const eventDuration =
      (newEvent.endDate.getTime() - newEvent.startDate.getTime()) / (1000 * 60);
    const conflictDuration = this.calculateConflictDuration(
      newEvent,
      conflictingEvents,
    );

    return Math.round((conflictDuration / eventDuration) * 100);
  }

  /**
   * Calculate conflict severity
   */
  private calculateSeverity(
    conflictPercentage: number,
    conflictCount: number,
  ): "low" | "medium" | "high" {
    if (conflictPercentage >= 80 || conflictCount >= 3) {
      return "high";
    } else if (conflictPercentage >= 40 || conflictCount >= 2) {
      return "medium";
    } else {
      return "low";
    }
  }

  /**
   * Generate conflict resolution suggestions
   */
  private generateConflictSuggestions(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
  ): ConflictSuggestion[] {
    const suggestions: ConflictSuggestion[] = [];

    // Find available time slots before and after conflicts
    const eventDay = startOfDay(newEvent.startDate);
    const eventDuration =
      (newEvent.endDate.getTime() - newEvent.startDate.getTime()) / (1000 * 60);

    // Suggestion 1: Move to earlier time slot
    const earlierSlot = this.findEarlierTimeSlot(
      newEvent,
      conflictingEvents,
      eventDuration,
    );
    if (earlierSlot) {
      suggestions.push({
        type: "time_adjustment",
        description: `Move to ${format(earlierSlot, "HH:mm")} (earlier time)`,
        suggestedTime: earlierSlot,
        suggestedEndTime: addMinutes(earlierSlot, eventDuration),
        reason: "Available time slot found earlier in the day",
      });
    }

    // Suggestion 2: Move to later time slot
    const laterSlot = this.findLaterTimeSlot(
      newEvent,
      conflictingEvents,
      eventDuration,
    );
    if (laterSlot) {
      suggestions.push({
        type: "time_adjustment",
        description: `Move to ${format(laterSlot, "HH:mm")} (later time)`,
        suggestedTime: laterSlot,
        suggestedEndTime: addMinutes(laterSlot, eventDuration),
        reason: "Available time slot found later in the day",
      });
    }

    // Suggestion 3: Shorten the event
    if (eventDuration > 60) {
      const shorterDuration = Math.max(30, eventDuration - 30);
      suggestions.push({
        type: "duration_change",
        description: `Reduce duration to ${shorterDuration} minutes`,
        suggestedTime: newEvent.startDate,
        suggestedEndTime: addMinutes(newEvent.startDate, shorterDuration),
        reason: "Shorter duration may reduce conflicts",
      });
    }

    // Suggestion 4: Move to next day
    const nextDaySlot = this.findNextDaySlot(newEvent, eventDuration);
    if (nextDaySlot) {
      suggestions.push({
        type: "date_change",
        description: `Move to ${format(nextDaySlot, "MMM dd, HH:mm")}`,
        suggestedTime: nextDaySlot,
        suggestedEndTime: addMinutes(nextDaySlot, eventDuration),
        reason: "Next available day with free time slot",
      });
    }

    // Suggestion 5: Split the event
    if (eventDuration > 120) {
      const halfDuration = eventDuration / 2;
      suggestions.push({
        type: "split_event",
        description: `Split into two ${halfDuration}-minute sessions`,
        reason: "Smaller time blocks may be easier to schedule",
      });
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Find available time slot earlier in the day
   */
  private findEarlierTimeSlot(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
    durationMinutes: number,
  ): Date | null {
    const eventDay = startOfDay(newEvent.startDate);
    const workStart = new Date(eventDay);
    workStart.setHours(this.options.workingHours.start, 0, 0, 0);

    // Get all events for this day (including conflicts and new event)
    const allEvents = [...conflictingEvents, newEvent].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    // Find gap before the conflicts
    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];
      const gapEnd = addMinutes(event.startDate, -this.options.bufferMinutes);
      const gapStart =
        i === 0
          ? workStart
          : addMinutes(allEvents[i - 1].endDate, this.options.bufferMinutes);

      const availableMinutes =
        (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60);

      if (availableMinutes >= durationMinutes && gapStart >= workStart) {
        return gapStart;
      }
    }

    return null;
  }

  /**
   * Find available time slot later in the day
   */
  private findLaterTimeSlot(
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[],
    durationMinutes: number,
  ): Date | null {
    const eventDay = startOfDay(newEvent.startDate);
    const workEnd = new Date(eventDay);
    workEnd.setHours(this.options.workingHours.end, 0, 0, 0);

    // Get all events for this day (including conflicts and new event)
    const allEvents = [...conflictingEvents, newEvent].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    // Find gap after the conflicts
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const event = allEvents[i];
      const gapStart = addMinutes(event.endDate, this.options.bufferMinutes);
      const gapEnd =
        i === allEvents.length - 1
          ? workEnd
          : addMinutes(allEvents[i + 1].startDate, -this.options.bufferMinutes);

      const availableMinutes =
        (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60);

      if (
        availableMinutes >= durationMinutes &&
        addMinutes(gapStart, durationMinutes) <= workEnd
      ) {
        return gapStart;
      }
    }

    return null;
  }

  /**
   * Find time slot on the next available day
   */
  private findNextDaySlot(
    newEvent: CalendarEvent,
    durationMinutes: number,
  ): Date | null {
    // Simple implementation - suggests same time next day
    const nextDay = new Date(newEvent.startDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Keep the same time but on next day
    return nextDay;
  }

  /**
   * Get alternative time suggestions for an event
   */
  suggestAlternativeTimes(
    event: CalendarEvent,
    existingEvents: CalendarEvent[],
    count: number = 3,
  ): Array<{ start: Date; end: Date; score: number; reason: string }> {
    const suggestions: Array<{
      start: Date;
      end: Date;
      score: number;
      reason: string;
    }> = [];
    const eventDuration =
      (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60);
    const eventDay = startOfDay(event.startDate);

    // Check different time slots throughout the day
    const workStart = this.options.workingHours.start;
    const workEnd = this.options.workingHours.end;

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const candidateStart = new Date(eventDay);
        candidateStart.setHours(hour, minute, 0, 0);
        const candidateEnd = addMinutes(candidateStart, eventDuration);

        // Skip if outside working hours
        if (candidateEnd.getHours() > workEnd) {
          continue;
        }

        // Create candidate event
        const candidateEvent: CalendarEvent = {
          ...event,
          startDate: candidateStart,
          endDate: candidateEnd,
        };

        // Check for conflicts
        const conflicts = this.findConflictsForEvent(
          candidateEvent,
          existingEvents,
        );

        if (conflicts.length === 0) {
          const score = this.calculateTimeSlotScore(
            candidateStart,
            hour,
            minute,
          );
          const reason = this.getTimeSlotReason(candidateStart, hour);

          suggestions.push({
            start: candidateStart,
            end: candidateEnd,
            score,
            reason,
          });
        }
      }
    }

    // Sort by score and return top suggestions
    return suggestions.sort((a, b) => b.score - a.score).slice(0, count);
  }

  /**
   * Calculate a score for a time slot (higher is better)
   */
  private calculateTimeSlotScore(
    time: Date,
    hour: number,
    minute: number,
  ): number {
    let score = 100;

    // Prefer certain hours
    if (hour >= 9 && hour <= 11) score += 20; // Morning preference
    if (hour >= 14 && hour <= 16) score += 15; // Afternoon preference
    if (hour >= 17) score -= 10; // Late day penalty

    // Prefer round times
    if (minute === 0) score += 10;
    if (minute === 30) score += 5;

    // Avoid very early or very late
    if (hour < 9) score -= 20;
    if (hour > 17) score -= 15;

    return score;
  }

  /**
   * Get reason for time slot suggestion
   */
  private getTimeSlotReason(time: Date, hour: number): string {
    if (hour >= 9 && hour <= 11) {
      return "Good morning time slot";
    } else if (hour >= 14 && hour <= 16) {
      return "Good afternoon time slot";
    } else if (hour >= 17) {
      return "Late afternoon slot";
    } else {
      return "Available time slot";
    }
  }

  /**
   * Calculate event overlap percentage
   */
  calculateEventOverlap(event1: CalendarEvent, event2: CalendarEvent): number {
    const overlapStart = new Date(
      Math.max(event1.startDate.getTime(), event2.startDate.getTime()),
    );
    const overlapEnd = new Date(
      Math.min(event1.endDate.getTime(), event2.endDate.getTime()),
    );

    if (overlapEnd <= overlapStart) {
      return 0;
    }

    const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
    const event1Duration =
      event1.endDate.getTime() - event1.startDate.getTime();

    return (overlapDuration / event1Duration) * 100;
  }
}

// Default instance
export const conflictDetector = new ConflictDetector();

/**
 * Quick conflict detection function
 */
export function detectConflicts(
  newEvents: CalendarEvent[],
  existingEvents: CalendarEvent[],
  options?: ConflictDetectionOptions,
): DetailedConflict[] {
  const detector = new ConflictDetector(options);
  return detector.detectSchedulingConflicts(newEvents, existingEvents);
}
