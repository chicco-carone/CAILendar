import { useEffect, useState } from "react";
import type { DayViewProps } from "@/utils/types";
import {
  formatInTimezone,
  isSameDayInTimezone,
  fromUTC,
} from "@/utils/date-utils";

export function CalendarDayView({
  currentDate,
  timeSlots,
  filteredEvents,
  searchQuery,
  handleTimeSlotClick,
  handleEventClick,
  calculateEventStyle,
  formatTime,
  formatHour,
}: DayViewProps) {
  const [currentTimeTop, setCurrentTimeTop] = useState<number>(0);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const updateCurrentTimeTop = () => {
      const now = new Date();
      if (!isSameDayInTimezone(now, currentDate, userTimezone)) {
        setCurrentTimeTop(-1);
        return;
      }
      const hour = now.getHours();
      const minute = now.getMinutes();
      const totalMinutes = hour * 60 + minute;
      setCurrentTimeTop(totalMinutes);
    };

    updateCurrentTimeTop();
    const interval = setInterval(updateCurrentTimeTop, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate, userTimezone]);

  const dayEvents = filteredEvents.filter((event) => {
    const eventDate = fromUTC(event.startDate, event.timezone);
    return isSameDayInTimezone(eventDate, currentDate, event.timezone);
  });

  return (
    <div
      className="flex-1 p-4 relative"
      style={{ height: "calc(100vh - 150px)" }}
    >
      <div className="absolute inset-0 m-4 bg-white/90 dark:bg-black/30 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-white/20 shadow-xl transition-colors overflow-hidden"></div>
      <div className="calendar-container custom-scrollbar overflow-auto h-full">
        <div className="relative w-full">
          {/* Day Header */}
          <div className="grid grid-cols-[60px,1fr] border-b border-gray-200 dark:border-white/20 transition-colors">
            <div className="w-[60px] p-2 text-center text-gray-500 dark:text-white/50 text-xs"></div>
            <div className="p-2 text-center border-l border-gray-200 dark:border-white/20 transition-colors">
              <div className="text-xs text-gray-500 dark:text-white/70 font-medium">
                {formatInTimezone(currentDate, userTimezone, "EEEE")}
              </div>
              <div className="text-lg font-medium mt-1 text-white bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto">
                {formatInTimezone(currentDate, userTimezone, "d")}
              </div>
            </div>
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-[60px,1fr]">
            {/* Time Labels */}
            <div className="relative w-[60px]">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-[60px] border-b border-gray-100 dark:border-white/10 transition-colors"
                >
                  <div className="text-xs text-gray-500 dark:text-white/50 -mt-2.5 pr-2 text-right">
                    {formatHour(time)}
                  </div>
                </div>
              ))}
            </div>

            {/* Events Grid */}
            <div className="border-l border-gray-200 dark:border-white/20 relative transition-colors">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-[60px] border-b border-gray-100 dark:border-white/10 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                  onClick={() =>
                    handleTimeSlotClick(currentDate.getDay() || 7, time)
                  }
                ></div>
              ))}

              {/* Events */}
              {dayEvents.map((event, i) => {
                const eventStyle = calculateEventStyle(
                  fromUTC(event.startDate, event.timezone),
                  fromUTC(event.endDate, event.timezone),
                );
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
                              .includes(searchQuery.toLowerCase()),
                          )))
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    style={{
                      ...eventStyle,
                      left: "4px",
                      right: "4px",
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="opacity-80 text-[10px] mt-1">
                      {`${formatTime(
                        formatInTimezone(
                          fromUTC(event.startDate, event.timezone),
                          event.timezone,
                          "HH:mm",
                        ),
                      )} - ${formatTime(
                        formatInTimezone(
                          fromUTC(event.endDate, event.timezone),
                          event.timezone,
                          "HH:mm",
                        ),
                      )}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
