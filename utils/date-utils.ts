import {
  format,
  parseISO,
  isValid,
  addHours,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz/formatInTimeZone";
import { toZonedTime } from "date-fns-tz/toZonedTime";
import { fromZonedTime } from "date-fns-tz/fromZonedTime";
import type { TimezoneAwareDate } from "./types";

/**
 * Creates a timezone-aware date object from a date and timezone
 */
export function createTimezoneAwareDate(
  date: Date | string,
  timezone: string,
): TimezoneAwareDate {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  // Convert the date to the specified timezone
  const zonedDate = toZonedTime(dateObj, timezone);
  return {
    date: zonedDate,
    timezone,
  };
}

/**
 * Formats a date in the specified timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string,
): string {
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Converts a date to UTC while preserving the timezone information
 */
export function toUTC(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Converts a UTC date to a specific timezone
 */
export function fromUTC(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}

/**
 * Gets the current time in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone: string): TimezoneAwareDate {
  const now = new Date();
  return createTimezoneAwareDate(now, timezone);
}

/**
 * Formats a timezone-aware date for display
 */
export function formatTimezoneAwareDate(
  { date, timezone }: TimezoneAwareDate,
  formatStr: string = "yyyy-MM-dd HH:mm:ss zzz",
): string {
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Compares two dates in the same timezone
 */
export function compareDatesInTimezone(
  date1: Date,
  date2: Date,
  timezone: string,
): number {
  const zonedDate1 = toZonedTime(date1, timezone);
  const zonedDate2 = toZonedTime(date2, timezone);
  return zonedDate1.getTime() - zonedDate2.getTime();
}

/**
 * Checks if two dates are the same day in the specified timezone
 */
export function isSameDayInTimezone(
  date1: Date,
  date2: Date,
  timezone: string,
): boolean {
  const zonedDate1 = toZonedTime(date1, timezone);
  const zonedDate2 = toZonedTime(date2, timezone);
  return (
    zonedDate1.getFullYear() === zonedDate2.getFullYear() &&
    zonedDate1.getMonth() === zonedDate2.getMonth() &&
    zonedDate1.getDate() === zonedDate2.getDate()
  );
}

/**
 * Safely creates a Date object from various inputs
 * Always returns a valid Date object, defaulting to current date if input is invalid
 */
export function createSafeDate(input?: Date | string | number): Date {
  if (!input) {
    return new Date();
  }

  let date: Date;

  if (input instanceof Date) {
    // If it's already a Date, check if it's valid
    if (isValid(input)) {
      // Clone the date to prevent mutations
      return new Date(input.getTime());
    } else {
      console.warn(
        "[date-utils] Invalid Date object received, using current date",
      );
      return new Date();
    }
  }

  if (typeof input === "string") {
    // Try parsing as ISO string first
    if (input.includes("T") || input.includes("Z")) {
      date = parseISO(input);
    } else {
      // Fallback to regular Date constructor
      date = new Date(input);
    }
  } else if (typeof input === "number") {
    date = new Date(input);
  } else {
    console.warn(
      "[date-utils] Unsupported date input type, using current date",
    );
    return new Date();
  }

  if (isValid(date)) {
    return date;
  } else {
    console.warn(
      "[date-utils] Failed to parse date input:",
      input,
      "using current date",
    );
    return new Date();
  }
}

/**
 * Safely clones a Date object
 */
export function cloneDate(date: Date): Date {
  if (!isValid(date)) {
    console.warn(
      "[date-utils] Attempting to clone invalid date, returning current date",
    );
    return new Date();
  }
  return new Date(date.getTime());
}

/**
 * Safely sets hours and minutes on a date without mutation
 */
export function setTimeOnDate(
  date: Date,
  hours: number,
  minutes: number,
): Date {
  if (!isValid(date)) {
    console.warn("[date-utils] Invalid date provided to setTimeOnDate");
    return new Date();
  }

  let result = cloneDate(date);
  result = setHours(result, hours);
  result = setMinutes(result, minutes);

  return result;
}

/**
 * Safely gets hours from a date
 */
export function getSafeHours(date: Date): number {
  if (!isValid(date)) {
    console.warn("[date-utils] Invalid date provided to getSafeHours");
    return 0;
  }
  return getHours(date);
}

/**
 * Safely gets minutes from a date
 */
export function getSafeMinutes(date: Date): number {
  if (!isValid(date)) {
    console.warn("[date-utils] Invalid date provided to getSafeMinutes");
    return 0;
  }
  return getMinutes(date);
}

/**
 * Validates if a date is valid and logs appropriate messages
 */
export function validateDate(date: Date, context?: string): boolean {
  const valid = isValid(date);
  if (!valid && context) {
    console.error(`[date-utils] Invalid date in ${context}:`, date);
  }
  return valid;
}

/**
 * Safely formats a date, returns fallback string if date is invalid
 */
export function safeFormat(
  date: Date,
  formatStr: string,
  fallback = "Invalid Date",
): string {
  if (!validateDate(date, "safeFormat")) {
    return fallback;
  }
  return format(date, formatStr);
}

/**
 * Creates a date with default time (used for date pickers)
 */
export function createDateWithDefaultTime(
  date: Date,
  defaultHour = 9,
  defaultMinute = 0,
): Date {
  if (!validateDate(date, "createDateWithDefaultTime")) {
    return new Date();
  }

  return setTimeOnDate(date, defaultHour, defaultMinute);
}

/**
 * Ensures end date is after start date, adjusting if necessary
 */
export function ensureValidDateRange(
  startDate: Date,
  endDate: Date,
): { startDate: Date; endDate: Date } {
  const safeStart = createSafeDate(startDate);
  let safeEnd = createSafeDate(endDate);

  // If end is before start, set end to 1 hour after start
  if (safeEnd <= safeStart) {
    safeEnd = addHours(safeStart, 1);
  }

  return { startDate: safeStart, endDate: safeEnd };
}
