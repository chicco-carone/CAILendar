import { format, parseISO } from "date-fns";
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
