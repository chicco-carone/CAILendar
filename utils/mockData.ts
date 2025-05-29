import { CalendarEvent } from "@/utils/types";

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

console.log("[MockData] Current date:", now);
console.log("[MockData] Today date:", today);
console.log("[MockData] Today ISO:", today.toISOString());
console.log("[MockData] Today locale:", today.toLocaleDateString());

const forcedToday = new Date(2025, 4, 27);
console.log("[MockData] Forced today:", forcedToday.toISOString());

console.log(
  "[MockData] Creating events for current date:",
  forcedToday.toISOString(),
);

const sampleEvents: CalendarEvent[] = [
  {
    id: 1,
    title: "Morning Standup",
    startDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate(),
      9,
      0,
    ),
    endDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate(),
      9,
      30,
    ),
    timezone: "Europe/Rome",
    color: "bg-blue-500",
    description: "Daily team sync",
    location: "Meeting Room A",
    attendees: ["Team A", "Team B"],
    organizer: "John Doe",
    calendarId: "my-calendar", // Added default calendarId
  },
  {
    id: 2,
    title: "Project Review",
    startDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 1,
      14,
      0,
    ),
    endDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 1,
      15,
      30,
    ),
    timezone: "Europe/Rome",
    color: "bg-green-500",
    description: "Quarterly project review",
    location: "Conference Room B",
    attendees: ["Project Team", "Stakeholders"],
    organizer: "Jane Smith",
    calendarId: "work", // Added default calendarId
  },
  {
    id: 3,
    title: "Client Meeting",
    startDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 2,
      10,
      0,
    ),
    endDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 2,
      11,
      0,
    ),
    timezone: "Europe/Rome",
    color: "bg-purple-500",
    description: "New client onboarding",
    location: "Virtual Meeting",
    attendees: ["Sales Team", "Client"],
    organizer: "Mike Johnson",
    calendarId: "personal", // Added default calendarId
  },
  {
    id: 4,
    title: "Team Building",
    startDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 3,
      15,
      0,
    ),
    endDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 3,
      17,
      0,
    ),
    timezone: "Europe/Rome",
    color: "bg-yellow-500",
    description: "Team building activities",
    location: "Office Garden",
    attendees: ["All Employees"],
    organizer: "HR Team",
    calendarId: "my-calendar", // Added default calendarId
  },
  {
    id: 5,
    title: "Product Launch",
    startDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 4,
      9,
      0,
    ),
    endDate: new Date(
      forcedToday.getFullYear(),
      forcedToday.getMonth(),
      forcedToday.getDate() + 4,
      12,
      0,
    ),
    timezone: "Europe/Rome",
    color: "bg-red-500",
    description: "New product launch event",
    location: "Main Auditorium",
    attendees: ["Marketing Team", "Press", "Partners"],
    organizer: "Sarah Wilson",
    calendarId: "work", // Added default calendarId
  },
];

console.log(
  "Sample events:",
  sampleEvents.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  })),
);

const myCalendars = [
  { id: "my-calendar", name: "My Calendar", color: "bg-blue-500" },
  { id: "work", name: "Work", color: "bg-green-500" },
  { id: "personal", name: "Personal", color: "bg-purple-500" },
  { id: "family", name: "Family", color: "bg-orange-500" },
];

console.log("[MockData] Sample events:", sampleEvents);

export { sampleEvents, myCalendars };
