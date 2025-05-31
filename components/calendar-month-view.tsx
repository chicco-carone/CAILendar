import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import type { MonthViewProps } from "@/utils/types";
import {
  formatInTimezone,
  isSameDayInTimezone,
  fromUTC,
} from "@/utils/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function CalendarMonthView({
  currentDate,
  filteredEvents,
  searchQuery,
  handleDateClick,
  handleEventClick,
  handleEmptyDateClick,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isMobile = useIsMobile();

  const startDay = monthStart.getDay();

  const emptyCells = Array.from({ length: startDay }, (_, i) => (
    <div
      key={`empty-${i}`}
      className="border border-gray-200 dark:border-white/20 transition-colors"
    ></div>
  ));

  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-white/20 rounded-lg overflow-hidden flex-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center bg-white dark:bg-black/30 text-sm font-medium text-gray-700 dark:text-white/70"
          >
            {day}
          </div>
        ))}

        {emptyCells}

        {days.map((day) => {
          const dayEvents = filteredEvents.filter((event) => {
            const eventDate = fromUTC(event.startDate, event.timezone);
            return isSameDayInTimezone(eventDate, day, event.timezone);
          });

          return (
            <div
              key={day.toISOString()}
              className={`border border-gray-200 dark:border-white/20 transition-colors flex flex-col ${
                isSameMonth(day, currentDate)
                  ? "bg-white dark:bg-black/30"
                  : "bg-gray-50 dark:bg-black/20"
              }`}
            >
              <div
                className={`p-1 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${
                  formatInTimezone(day, userTimezone, "d") ===
                    formatInTimezone(new Date(), userTimezone, "d") &&
                  isSameMonth(day, new Date())
                    ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto"
                    : ""
                }`}
                onClick={() => handleDateClick(day)}
              >
                {formatInTimezone(day, userTimezone, "d")}
              </div>
              <div 
                className="p-1 space-y-1 flex-1 overflow-y-auto cursor-pointer"
                onClick={(e) => {
                  // Only create new event if clicking on empty space (not on an event)
                  if (e.target === e.currentTarget && handleEmptyDateClick) {
                    handleEmptyDateClick(day);
                  }
                }}
              >
                {dayEvents.map((event, i) => (
                  <div
                    key={i}
                    className={`text-xs p-1 rounded truncate cursor-pointer ${
                      event.color
                    } ${
                      searchQuery &&
                      (event.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                        (event.description &&
                          event.description
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())) ||
                        (event.location &&
                          event.location
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())) ||
                        (event.attendees &&
                          event.attendees.some((attendee) =>
                            attendee
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )))
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the empty space click
                      handleEventClick(event);
                    }}
                  >
                    {!isMobile &&
                      `${formatInTimezone(
                        fromUTC(event.startDate, event.timezone),
                        event.timezone,
                        "HH:mm",
                      )} `}
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
