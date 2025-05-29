"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTimeFormat } from "@/hooks/use-time-format";
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addHours,
} from "date-fns";
import { EventModal } from "@/components/event-modal";
import { ChevronLeft, ChevronRight, Clock, Trash } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { EventDetailsModal } from "@/components/event-details-modal";
import { CalendarDayView } from "@/components/calendar-day-view";
import { CalendarWeekView } from "@/components/calendar-week-view";
import { CalendarMonthView } from "@/components/calendar-month-view";
import { CalendarAgendaView } from "@/components/calendar-agenda-view";
import type { CalendarEvent, UserCalendar } from "@/utils/types";
import { myCalendars } from "@/utils/mockData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CalendarViewProps } from "@/utils/types";

let logger: any = null;
const getLogger = () => {
  if (!logger) {
    logger = {
      debug: (...args: any[]) => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[CalendarView]", ...args);
        }
      },
    };
  }
  return logger;
};

function CalendarView({
  events: originalEvents,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  searchQuery = "",
  currentDate: externalCurrentDate,
  onDateChange,
  initialView = "week",
  calendars, // Add calendars prop
  defaultCalendarId, // Add defaultCalendarId prop
}: CalendarViewProps & { 
  calendars?: UserCalendar[]; 
  defaultCalendarId?: string; 
}): React.JSX.Element {
  const [view, setView] = useState<"day" | "week" | "month" | "agenda">(
    (initialView as any) === "agenda" ? "agenda" : initialView,
  );
  const [currentDate, setCurrentDate] = useState<Date | null>(externalCurrentDate || null);
  const { timeFormat, setTimeFormat, formatTime, formatHour } = useTimeFormat();

  // Use calendars from props or fallback to mockData
  const availableCalendars = calendars && calendars.length > 0 ? calendars : myCalendars;

  const {
    isModalOpen,
    setIsModalOpen,
    editingEvent,
    setEditingEvent,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    eventToDelete,
    setEventToDelete,
    selectedEvent,
    setSelectedEvent,
    handleEditEvent,
    handleDeleteEvent,
    confirmDeleteEvent,
    handleSaveEvent,
  } = useCalendarEvents({
    onEventAdd,
    onEventUpdate,
    onEventDelete,
  });

  useEffect(() => {
    if (externalCurrentDate) {
      setCurrentDate(externalCurrentDate);
    } else if (currentDate === null) {
      setCurrentDate(new Date());
    }
  }, [externalCurrentDate, currentDate]);

  const scrollToCurrentTime = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const scrollPosition = currentHour * 60 - 100;

    const calendarContainers = document.querySelectorAll(".calendar-container");
    calendarContainers.forEach((container) => {
      container.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    if (view === "day" || view === "week") {
      const timer = setTimeout(() => {
        scrollToCurrentTime();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [view, scrollToCurrentTime]);

  useEffect(() => {
    setView((initialView as any) === "agenda" ? "agenda" : initialView);
  }, [initialView]);

  useEffect(() => {
    const handleCreateEvent = () => {
      const now = new Date();
      const endDate = addHours(now, 1);

      const newEvent: CalendarEvent = {
        id: Date.now(),
        title: "",
        startDate: now,
        endDate: endDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        color: availableCalendars[0]?.color || "bg-blue-500",
        description: "",
        location: "",
        attendees: [],
        organizer: "You",
        calendarId: defaultCalendarId || availableCalendars[0]?.id || "my-calendar",
      };

      setEditingEvent(newEvent);
      setIsModalOpen(true);
    };

    document.addEventListener("create-event", handleCreateEvent);
    return () =>
      document.removeEventListener("create-event", handleCreateEvent);
  }, [availableCalendars, defaultCalendarId]);

  const filteredEvents = useMemo(() => {
    getLogger().debug(
      "Original events:",
      originalEvents.length,
      originalEvents,
    );
    getLogger().debug("Search query:", searchQuery);

    if (!searchQuery.trim()) {
      getLogger().debug("No search query, returning all events");
      return originalEvents;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = originalEvents.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        (event.description &&
          event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query)) ||
        (event.attendees &&
          event.attendees.some((attendee) =>
            attendee.toLowerCase().includes(query),
          )),
    );
    getLogger().debug("Filtered events:", filtered.length, filtered);
    return filtered;
  }, [originalEvents, searchQuery]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleTimeSlotClick = (day: number, hour: number) => {
    if (!currentDate) return;
    const slotDate = new Date(currentDate);
    slotDate.setHours(hour, 0, 0, 0);

    const endDate = new Date(slotDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: "",
      startDate: slotDate,
      endDate: endDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      color: availableCalendars[0]?.color || "bg-blue-500",
      description: "",
      location: "",
      attendees: [],
      organizer: "You",
      calendarId: defaultCalendarId || availableCalendars[0]?.id || "my-calendar",
    };

    setEditingEvent(newEvent);
    setIsModalOpen(true);
  };

  const nextDate = () => {
    if (!currentDate) return;
    let newDate;
    if (view === "day") {
      newDate = addDays(currentDate, 1);
    } else if (view === "week") {
      newDate = addDays(currentDate, 7);
    } else {
      newDate = addMonths(currentDate, 1);
    }
    setCurrentDate(newDate);
    if (onDateChange) onDateChange(newDate, view);
  };

  const prevDate = () => {
    if (!currentDate) return;
    let newDate;
    if (view === "day") {
      newDate = addDays(currentDate, -1);
    } else if (view === "week") {
      newDate = addDays(currentDate, -7);
    } else {
      newDate = subMonths(currentDate, 1);
    }
    setCurrentDate(newDate);
    if (onDateChange) onDateChange(newDate, view);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onDateChange) onDateChange(today, view);
  };

  const handleViewChange = (newView: "day" | "week" | "month" | "agenda") => {
    setView(newView);
    if (currentDate && onDateChange) onDateChange(currentDate, newView);
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const weekDays = useMemo(() => {
    if (!currentDate) return [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    if (!currentDate) return [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day < endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  const dateHeader = useMemo(() => {
    if (!currentDate) return "";
    if (view === "day") {
      return format(currentDate, "MMMM d, yyyy");
    } else if (view === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      if (!start || !end) return "";
      return `${format(start, "MMMM d")} - ${format(end, "MMMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  }, [currentDate, view, weekDays]);

  const calculateEventStyle = (
    startDate: Date,
    endDate: Date,
  ): { top: string; height: string } => {
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const duration = endMinutes - startMinutes;

    return {
      top: `${startMinutes}px`,
      height: `${duration}px`,
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/20 transition-colors">
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
            onClick={goToToday}
          >
            Today
          </button>
          <div className="flex">
            <button
              className="p-2 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-l-md transition-colors"
              onClick={prevDate}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-r-md transition-colors"
              onClick={nextDate}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {dateHeader}
          </h2>
        </div>

        <div className="min-w-[120px] w-fit">
          {useIsMobile() ? (
            <Select value={view} onValueChange={handleViewChange}>
              <SelectTrigger className="w-[120px] bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 rounded-md p-1 bg-gray-100 dark:bg-white/5 transition-colors">
              <button
                onClick={() => handleViewChange("day")}
                className={`px-3 py-1 rounded ${
                  view === "day" ? "bg-white dark:bg-white/20 shadow-sm" : ""
                } text-gray-700 dark:text-white text-sm transition-colors`}
              >
                Day
              </button>
              <button
                onClick={() => handleViewChange("week")}
                className={`px-3 py-1 rounded ${
                  view === "week" ? "bg-white dark:bg-white/20 shadow-sm" : ""
                } text-gray-700 dark:text-white text-sm transition-colors`}
              >
                Week
              </button>
              <button
                onClick={() => handleViewChange("month")}
                className={`px-3 py-1 rounded ${
                  view === "month" ? "bg-white dark:bg-white/20 shadow-sm" : ""
                } text-gray-700 dark:text-white text-sm transition-colors`}
              >
                Month
              </button>
              <button
                onClick={() => handleViewChange("agenda")}
                className={`px-3 py-1 rounded ${
                  view === "agenda" ? "bg-white dark:bg-white/20 shadow-sm" : ""
                } text-gray-700 dark:text-white text-sm transition-colors`}
              >
                Agenda
              </button>
              <button
                onClick={() =>
                  setTimeFormat(timeFormat === "12h" ? "24h" : "12h")
                }
                className="px-3 py-1 ml-2 rounded bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white text-xs transition-colors"
              >
                {timeFormat === "12h" ? "24h" : "12h"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Scroll to current time button */}
      {(view === "day" || view === "week") && (
        <div className="absolute right-6 top-24 z-10">
          <button
            onClick={scrollToCurrentTime}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors flex items-center justify-center"
            title="Scroll to current time"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
      )}

      {view === "day" && (
        <CalendarDayView
          currentDate={currentDate}
          timeSlots={timeSlots}
          filteredEvents={filteredEvents}
          searchQuery={searchQuery}
          handleTimeSlotClick={handleTimeSlotClick}
          handleEventClick={handleEventClick}
          calculateEventStyle={calculateEventStyle}
          formatTime={formatTime}
          formatHour={formatHour}
        />
      )}

      {view === "week" && (
        <CalendarWeekView
          weekDays={weekDays}
          timeSlots={timeSlots}
          filteredEvents={filteredEvents}
          searchQuery={searchQuery}
          handleTimeSlotClick={handleTimeSlotClick}
          handleEventClick={handleEventClick}
          calculateEventStyle={calculateEventStyle}
          formatTime={formatTime}
          formatHour={formatHour}
        />
      )}

      {/* Month View */}
      {view === "month" && currentDate && (
        <CalendarMonthView
          currentDate={currentDate}
          filteredEvents={filteredEvents}
          searchQuery={searchQuery}
          handleDateClick={(date: Date) => {
            setCurrentDate(date);
            if (onDateChange) onDateChange(date, view);
          }}
          handleEventClick={handleEventClick}
        />
      )}

      {view === "agenda" && currentDate && (
        <CalendarAgendaView
          filteredEvents={filteredEvents}
          currentDate={currentDate}
          searchQuery={searchQuery}
          handleEventClick={handleEventClick}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Event Create/Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onCloseAction={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSaveAction={(eventData: Partial<CalendarEvent>) =>
          handleSaveEvent(eventData)
        }
        event={editingEvent || undefined}
        mode={editingEvent && editingEvent.id ? "edit" : "create"}
        calendars={availableCalendars} // Pass calendars from mockData
        defaultCalendarId={defaultCalendarId || availableCalendars[0]?.id} // Pass defaultCalendarId
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CalendarView;
