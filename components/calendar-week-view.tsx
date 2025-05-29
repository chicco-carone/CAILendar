import {
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
  parse,
  differenceInMinutes,
  getHours,
  getMinutes,
} from "date-fns";
import { useEffect, useState } from "react";
import type { CalendarEvent, WeekViewProps } from "@/utils/types";

const ensureDate = (date: Date | string | undefined | null): Date => {
  if (date === undefined || date === null) {
    console.warn("Received undefined or null date, returning current date");
    return new Date();
  }

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "string") {
    try {
      const parsedISO = parseISO(date);
      if (isValid(parsedISO)) {
        return parsedISO;
      }

      const formats = [
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd",
      ];

      for (const dateFormat of formats) {
        try {
          const parsed = parse(date, dateFormat, new Date());
          if (isValid(parsed)) {
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }

      const fallbackDate = new Date(date);
      if (isValid(fallbackDate)) {
        return fallbackDate;
      }
    } catch (error) {
      console.error(`Error parsing date string: ${date}`, error);
    }
  }

  console.warn(`Could not parse date: ${date}, falling back to current date`);
  return new Date();
};

const calculateEventLayout = (
  events: CalendarEvent[],
  dayStart: Date,
  dayEnd: Date
) => {
  const sortedEvents = events
    .map((event) => ({
      ...event,
      start: event.startDate < dayStart ? dayStart : event.startDate,
      end: event.endDate > dayEnd ? dayEnd : event.endDate,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const eventGroups: Array<Array<(typeof sortedEvents)[0]>> = [];

  sortedEvents.forEach((event) => {
    let placed = false;
    for (const group of eventGroups) {
      const hasOverlap = group.some(
        (groupEvent) =>
          event.start < groupEvent.end && event.end > groupEvent.start
      );
      if (!hasOverlap) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      eventGroups.push([event]);
    }
  });

  const eventLayouts = new Map();

  eventGroups.forEach((group, groupIndex) => {
    const groupWidth = 100 / eventGroups.length;

    group.forEach((event, eventIndex) => {
      const startHour = getHours(event.start);
      const startMinute = getMinutes(event.start);
      const startMinutes = startHour * 60 + startMinute;

      const endHour = getHours(event.end);
      const endMinute = getMinutes(event.end);
      const endMinutes = endHour * 60 + endMinute;

      const topPosition = startMinutes;
      const heightPixels = Math.max(endMinutes - startMinutes, 30);

      console.log(`[WeekView] Calculating layout for event "${event.title}":`, {
        startTime: `${startHour}:${startMinute}`,
        endTime: `${endHour}:${endMinute}`,
        topPos: topPosition,
        height: heightPixels,
      });

      eventLayouts.set(event.id, {
        top: topPosition,
        height: heightPixels,
        left: groupIndex * groupWidth,
        width: groupWidth - 1,
      });
    });
  });

  return eventLayouts;
};

export function CalendarWeekView({
  weekDays,
  timeSlots,
  filteredEvents,
  searchQuery,
  handleTimeSlotClick,
  handleEventClick,
  calculateEventStyle,
  formatTime,
  formatHour,
}: WeekViewProps) {
  console.log(
    "[WeekView] Component rendered with events:",
    filteredEvents.length
  );

  const normalizedEvents = filteredEvents;

  const [currentTimePos, setCurrentTimePos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    console.log(
      "[WeekView] Week days:",
      weekDays.map((d) => format(ensureDate(d), "yyyy-MM-dd"))
    );
    console.log("[WeekView] Raw filtered events:", filteredEvents);
    console.log(
      "[WeekView] Raw filtered events length:",
      filteredEvents.length
    );
    console.log("[WeekView] First event:", filteredEvents[0]);
    console.log("[WeekView] Normalized events:", normalizedEvents);
  }, [weekDays, filteredEvents, normalizedEvents]);

  useEffect(() => {
    const updateCurrentTimePos = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const dayIndex = weekDays.findIndex((day) =>
        isSameDay(ensureDate(day), now)
      );
      if (dayIndex === -1) {
        setCurrentTimePos(null);
        return;
      }

      const top = currentHour * 60 + currentMinute;
      const left = (dayIndex * 100) / 7;

      setCurrentTimePos({ top, left });
    };

    updateCurrentTimePos();
    const interval = setInterval(updateCurrentTimePos, 60 * 1000);
    return () => clearInterval(interval);
  }, [weekDays]);

  return (
    <div
      className="flex-1 p-4 relative"
      style={{ height: "calc(100vh - 150px)" }}
    >
      <div className="absolute inset-0 m-4 bg-white/90 dark:bg-black/30 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-white/20 shadow-xl transition-colors overflow-hidden"></div>
      <div className="calendar-container custom-scrollbar overflow-auto h-full">
        <div className="relative w-full">
          {/* Week Header */}
          <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-black/50 grid grid-cols-[auto,repeat(7,1fr)] border-b border-gray-200 dark:border-white/20 transition-colors">
            <div className="p-2 text-center text-gray-500 dark:text-white/50 text-xs w-16 min-w-16"></div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className="p-2 text-center border-l border-gray-200 dark:border-white/20 transition-colors"
              >
                <div className="text-xs text-gray-500 dark:text-white/70 font-medium">
                  {format(ensureDate(day), "EEE")}
                </div>
                <div
                  className={`text-lg font-medium mt-1 ${
                    isSameDay(ensureDate(day), new Date())
                      ? "text-white bg-blue-500"
                      : "text-gray-700 dark:text-white"
                  } rounded-full w-8 h-8 flex items-center justify-center mx-auto`}
                >
                  {format(ensureDate(day), "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-[auto,repeat(7,1fr)]">
            {/* Time Labels */}
            <div className="relative w-16 min-w-16">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-[60px] border-b border-gray-100 dark:border-white/10 transition-colors flex items-start justify-end pr-2 pt-1"
                >
                  <div className="text-xs text-gray-500 dark:text-white/50">
                    {formatHour(time)}
                  </div>
                </div>
              ))}
            </div>

            {/* Week Grid */}
            {weekDays.map((day, dayIndex) => {
              const safeDay = ensureDate(day);
              console.log(
                "[WeekView] Processing day:",
                format(safeDay, "yyyy-MM-dd")
              );
              console.log(
                "[WeekView] Normalized events count:",
                normalizedEvents.length
              );

              const dayEvents = normalizedEvents.filter((event) => {
                const eventStart = ensureDate(event.startDate);
                const eventEnd = ensureDate(event.endDate);

                console.log("[WeekView] Checking event:", {
                  title: event.title,
                  eventStart: format(eventStart, "yyyy-MM-dd HH:mm"),
                  eventEnd: format(eventEnd, "yyyy-MM-dd HH:mm"),
                  safeDay: format(safeDay, "yyyy-MM-dd"),
                  startOfDayEvent: format(startOfDay(eventStart), "yyyy-MM-dd"),
                  endOfDayEvent: format(endOfDay(eventEnd), "yyyy-MM-dd"),
                });

                const isVisible =
                  isWithinInterval(safeDay, {
                    start: startOfDay(eventStart),
                    end: endOfDay(eventEnd),
                  }) ||
                  isSameDay(safeDay, eventStart) ||
                  isSameDay(safeDay, eventEnd);

                console.log("[WeekView] Event visible:", isVisible);
                return isVisible;
              });

              const dayStart = startOfDay(safeDay);
              const dayEnd = endOfDay(safeDay);
              const eventLayouts = calculateEventLayout(
                dayEvents,
                dayStart,
                dayEnd
              );

              console.log(
                "[WeekView] Events for day:",
                format(safeDay, "yyyy-MM-dd"),
                dayEvents
              );

              return (
                <div
                  key={dayIndex}
                  className="border-l border-gray-200 dark:border-white/20 relative transition-colors"
                >
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-[60px] border-b border-gray-100 dark:border-white/10 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                      onClick={() =>
                        handleTimeSlotClick(safeDay.getDay() || 7, time)
                      }
                    ></div>
                  ))}

                  {/* Events */}
                  {dayEvents.map((event, i) => {
                    const layout = eventLayouts.get(event.id);
                    if (!layout) return null;

                    console.log("[WeekView] Rendering event:", {
                      title: event.title,
                      layout,
                      startDate: format(event.startDate, "yyyy-MM-dd HH:mm"),
                      endDate: format(event.endDate, "yyyy-MM-dd HH:mm"),
                      startHour: getHours(event.startDate),
                      startMinutes: getMinutes(event.startDate),
                      endHour: getHours(event.endDate),
                      endMinutes: getMinutes(event.endDate),
                      duration: differenceInMinutes(
                        event.endDate,
                        event.startDate
                      ),
                    });

                    return (
                      <div
                        key={i}
                        className={`absolute ${
                          event.color
                        } rounded-md p-2 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg ${
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
                                  .includes(searchQuery.toLowerCase())
                              )))
                            ? "ring-2 ring-white"
                            : ""
                        }`}
                        style={{
                          top: `${layout.top}px`,
                          height: `${layout.height}px`,
                          left: `${layout.left}%`,
                          width: `${layout.width}%`,
                          zIndex: 10,
                          overflow: "hidden",
                        }}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="opacity-80 text-[10px] mt-1">{`${formatTime(
                          format(event.startDate, "HH:mm")
                        )} - ${formatTime(
                          format(event.endDate, "HH:mm")
                        )}`}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Current Time Indicator */}
          {currentTimePos && (
            <div
              className="absolute border-t-2 border-red-500 bg-red-500 h-[2px] z-30"
              style={{
                top: `${currentTimePos.top + 84}px`,
                left: `4rem`,
                right: `0`,
                pointerEvents: "none",
              }}
            >
              <div className="absolute -left-2 -top-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
