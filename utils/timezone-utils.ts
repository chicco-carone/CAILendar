import { format, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Formatta una data in una timezone specifica
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string = "yyyy-MM-dd HH:mm",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Converte una data locale in UTC considerando la timezone
 */
export function localToUtc(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Converte una data UTC in una timezone specifica
 */
export function utcToLocal(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}

/**
 * Ottiene l'offset di una timezone per una specifica data
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date(),
): string {
  try {
    const offset = formatInTimeZone(date, timezone, "xxx");
    return offset;
  } catch (error) {
    return "+00:00";
  }
}

/**
 * Formatta un evento con la sua timezone per la visualizzazione
 */
export function formatEventTime(
  startDate: Date,
  endDate: Date,
  timezone: string,
  showTimezone: boolean = true,
): string {
  const startFormatted = formatDateInTimezone(startDate, timezone, "HH:mm");
  const endFormatted = formatDateInTimezone(endDate, timezone, "HH:mm");

  if (showTimezone) {
    const offset = getTimezoneOffset(timezone, startDate);
    return `${startFormatted} - ${endFormatted} (${timezone.split("/").pop()} ${offset})`;
  }

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Controlla se due eventi si sovrappongono considerando le loro timezone
 */
export function eventsOverlap(
  event1: { startDate: Date; endDate: Date; timezone: string },
  event2: { startDate: Date; endDate: Date; timezone: string },
): boolean {
  // Converti entrambi gli eventi in UTC per il confronto
  const event1StartUtc = localToUtc(event1.startDate, event1.timezone);
  const event1EndUtc = localToUtc(event1.endDate, event1.timezone);
  const event2StartUtc = localToUtc(event2.startDate, event2.timezone);
  const event2EndUtc = localToUtc(event2.endDate, event2.timezone);

  return event1StartUtc < event2EndUtc && event2StartUtc < event1EndUtc;
}
