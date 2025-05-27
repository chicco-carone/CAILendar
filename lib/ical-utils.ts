import { v4 as uuidv4 } from "uuid";
import { format, parse } from "date-fns";
import { CalendarEvent } from "@/utils/types";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

const formatICalDateTime = (date: Date, timezone: string): string => {
  try {
    // Convert the Date to the event's timezone and format it
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, "yyyyMMdd'T'HHmmss");
  } catch (error) {
    const now = new Date();
    return format(now, "yyyyMMdd'T'HHmmss");
  }
};

const parseICalDateTime = (iCalDateTime: string, timezone: string): Date => {
  try {
    const dateTimeStr = iCalDateTime.replace(/[TZ]/g, "");
    const year = dateTimeStr.substring(0, 4);
    const month = dateTimeStr.substring(4, 6);
    const day = dateTimeStr.substring(6, 8);
    const hour = dateTimeStr.substring(8, 10) || "00";
    const minute = dateTimeStr.substring(10, 12) || "00";

    // Create a date in the event's timezone and convert to UTC
    const localDateTime = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:00`,
    );
    return fromZonedTime(localDateTime, timezone);
  } catch (error) {
    return new Date();
  }
};

export const eventToICal = (event: CalendarEvent): string => {
  const eventId = event.id || uuidv4();

  const now = new Date();
  const created = format(now, "yyyyMMdd'T'HHmmss'Z'");

  const startDateTime = formatICalDateTime(event.startDate, event.timezone);
  const endDateTime = formatICalDateTime(event.endDate, event.timezone);

  const iCalEvent = [
    "BEGIN:VEVENT",
    `UID:${eventId}`,
    `DTSTAMP:${created}`,
    `DTSTART;TZID=${event.timezone}:${startDateTime}`,
    `DTEND;TZID=${event.timezone}:${endDateTime}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ""}`,
    `LOCATION:${event.location || ""}`,
    `ORGANIZER:${event.organizer || ""}`,
    `X-COLOR:${event.color}`,
  ];

  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach((attendee) => {
      iCalEvent.push(`ATTENDEE:${attendee}`);
    });
  }

  iCalEvent.push("END:VEVENT");

  return iCalEvent.join("\r\n");
};

export const iCalToEvent = (iCalEvent: string): CalendarEvent => {
  const lines = iCalEvent.split(/\r\n|\n|\r/);
  const event: Partial<CalendarEvent> = {
    id: 0,
    title: "",
    startDate: new Date(),
    endDate: new Date(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: "bg-blue-500",
    description: "",
    location: "",
    attendees: [],
    organizer: "",
  };

  let startDateTime = "";
  let endDateTime = "";
  let timezone = event.timezone || "UTC";

  lines.forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":");

    // Handle timezone-aware DTSTART/DTEND
    if (key.includes("DTSTART")) {
      if (key.includes("TZID=")) {
        timezone = key.split("TZID=")[1].split(":")[0];
      }
      startDateTime = value;
    } else if (key.includes("DTEND")) {
      endDateTime = value;
    } else {
      switch (key) {
        case "UID":
          event.id = value;
          break;
        case "SUMMARY":
          event.title = value;
          break;
        case "DESCRIPTION":
          event.description = value;
          break;
        case "LOCATION":
          event.location = value;
          break;
        case "ORGANIZER":
          event.organizer = value;
          break;
        case "X-COLOR":
          event.color = value;
          break;
        case "ATTENDEE":
          if (!event.attendees) event.attendees = [];
          event.attendees.push(value);
          break;
      }
    }
  });

  event.timezone = timezone;

  if (startDateTime) {
    event.startDate = parseICalDateTime(startDateTime, timezone);
  }

  if (endDateTime) {
    event.endDate = parseICalDateTime(endDateTime, timezone);
  }

  return event as CalendarEvent;
};

export const createICalendar = (events: CalendarEvent[]): string => {
  const iCalHeader = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lovy-tech Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n");

  const iCalFooter = "END:VCALENDAR";

  const iCalEvents = events.map((event) => eventToICal(event)).join("\r\n");

  return `${iCalHeader}\r\n${iCalEvents}\r\n${iCalFooter}`;
};

export const parseICalendar = (iCalData: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  const eventStrings = iCalData
    .split("BEGIN:VEVENT")
    .filter((str) => str.includes("END:VEVENT"))
    .map((str) => `BEGIN:VEVENT${str.split("END:VEVENT")[0]}END:VEVENT`);

  eventStrings.forEach((eventStr) => {
    try {
      const event = iCalToEvent(eventStr);
      events.push(event);
    } catch (error) {
      console.error("Error parsing iCal event:", error);
    }
  });

  return events;
};

export const saveEventsToLocalStorage = (events: CalendarEvent[]): void => {
  try {
    console.log(
      "[ical-utils] Saving events to localStorage:",
      events.length,
      events,
    );

    // Temporarily use JSON format instead of iCal for debugging
    const eventsData = JSON.stringify(events, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });

    localStorage.setItem("calendar_events_json", eventsData);
    console.log("[ical-utils] Successfully saved to localStorage as JSON");

    // Also save as iCal for backward compatibility
    const iCalData = createICalendar(events);
    localStorage.setItem("calendar_events_ical", iCalData);
    console.log("[ical-utils] Also saved as iCal");
  } catch (error) {
    console.error("Error saving events to localStorage:", error);
  }
};

export const loadEventsFromLocalStorage = (): CalendarEvent[] => {
  try {
    console.log("[ical-utils] Loading events from localStorage...");

    // First try to load from JSON format (more reliable)
    const jsonData = localStorage.getItem("calendar_events_json");
    if (jsonData) {
      console.log(
        "[ical-utils] Found JSON data:",
        jsonData.substring(0, 200) + "...",
      );
      const eventsData = JSON.parse(jsonData);
      const events = eventsData.map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }));
      console.log(
        "[ical-utils] Loaded events from JSON:",
        events.length,
        events,
      );
      return events;
    }

    // Fallback to iCal format
    const iCalData = localStorage.getItem("calendar_events_ical");
    console.log("[ical-utils] iCal data from localStorage:", iCalData);

    if (!iCalData) {
      console.log("[ical-utils] No data found, returning empty array");
      return [];
    }

    const parsedEvents = parseICalendar(iCalData);
    console.log(
      "[ical-utils] Parsed events from iCal:",
      parsedEvents.length,
      parsedEvents,
    );
    return parsedEvents;
  } catch (error) {
    console.error("Error loading events from localStorage:", error);
    return [];
  }
};

export const downloadEventsAsICS = (events: CalendarEvent[]): void => {
  const iCalData = createICalendar(events);
  const blob = new Blob([iCalData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "calendar-events.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
