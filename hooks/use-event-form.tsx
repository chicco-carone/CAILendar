"use client";

import { useState, useEffect } from "react";
import { useTimezone } from "@/hooks/use-timezone";
import type { CalendarEvent, EventModalProps } from "@/utils/types";
import {
  createSafeDate,
  setTimeOnDate,
  getSafeHours,
  getSafeMinutes,
  validateDate,
  ensureValidDateRange,
} from "@/utils/date-utils";
import { Logger } from "@/utils/logger";

const logger = new Logger("useEventForm", true);

// Calendar configuration constants
const CALENDAR_OPTIONS = [
  { name: "My Calendar", color: "bg-blue-500" },
  { name: "Work", color: "bg-green-500" },
  { name: "Personal", color: "bg-purple-500" },
  { name: "Family", color: "bg-orange-500" },
] as const;

const COLOR_MAP: { [key: string]: string } = {
  "My Calendar": "bg-blue-500",
  Work: "bg-green-500",
  Personal: "bg-purple-500",
  Family: "bg-orange-500",
};

export function useEventForm({
  mode,
  event,
  onSaveAction,
  onModify,
  onCloseAction,
}: Pick<
  EventModalProps,
  "mode" | "event" | "onSaveAction" | "onModify" | "onCloseAction"
>) {
  const { browserTimezone } = useTimezone();

  // Form state
  const [startDate, setStartDate] = useState<Date>(() => createSafeDate());
  const [endDate, setEndDate] = useState<Date>(() => {
    const now = createSafeDate();
    return setTimeOnDate(now, getSafeHours(now) + 1, getSafeMinutes(now));
  });
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState("");
  const [calendar, setCalendar] = useState("My Calendar");
  const [timezone, setTimezone] = useState(browserTimezone || "Europe/Rome");
  const [isAllDay, setIsAllDay] = useState(false);

  // Create stable keys for dependency tracking
  const eventKey = event?.id;
  const eventStartDateStr = event?.startDate?.toISOString();
  const eventEndDateStr = event?.endDate?.toISOString();

  // Initialize form state based on mode and event
  useEffect(() => {
    const renderStart = performance.now();
    logger.debug("useEventForm effect triggered", { mode, eventKey });

    if (mode === "edit" && event) {
      logger.debug("Processing event in edit mode:", {
        eventId: event.id,
        eventTitle: event.title,
        eventStartDate: event.startDate?.toISOString(),
        eventEndDate: event.endDate?.toISOString(),
      });

      // Set form fields from event
      if (event.title !== undefined) {
        logger.debug("Setting title:", event.title);
        setTitle(event.title || "");
      }
      if (event.location !== undefined) {
        logger.debug("Setting location:", event.location);
        setLocation(event.location || "");
      }
      if (event.description !== undefined) {
        logger.debug("Setting description:", event.description);
        setDescription(event.description || "");
      }

      // Set dates
      if (event.startDate) {
        const safeStartDate = createSafeDate(event.startDate);
        logger.debug("Setting start date:", safeStartDate.toISOString());
        setStartDate(safeStartDate);
      }
      if (event.endDate) {
        const safeEndDate = createSafeDate(event.endDate);
        logger.debug("Setting end date:", safeEndDate.toISOString());
        setEndDate(safeEndDate);
      }
      if (event.timezone) {
        logger.debug("Setting timezone:", event.timezone);
        setTimezone(event.timezone);
      }

      // Set calendar based on event color
      const calendarEntry = CALENDAR_OPTIONS.find(
        (cal) => cal.color === event.color,
      );
      if (calendarEntry) {
        logger.debug("Setting calendar:", calendarEntry.name);
        setCalendar(calendarEntry.name);
      }

      // Set attendees
      if (event.attendees && Array.isArray(event.attendees)) {
        logger.debug("Setting attendees:", event.attendees);
        setAttendees(event.attendees.join(", "));
      }

      // Set all-day status
      if (event.isAllDay !== undefined) {
        logger.debug("Setting isAllDay:", event.isAllDay);
        setIsAllDay(event.isAllDay);
      }

      logger.debug("Edit mode state initialization completed");
    } else if (mode === "create") {
      logger.debug("Initializing create mode state");
      setTitle("");
      setLocation("");
      setDescription("");
      setAttendees("");
      const now = createSafeDate();
      setStartDate(now);
      const newEndDate = setTimeOnDate(
        now,
        getSafeHours(now) + 1,
        getSafeMinutes(now),
      );
      setEndDate(newEndDate);
      setCalendar("My Calendar");
      logger.debug("Create mode state initialization completed");
    }

    const renderTime = performance.now() - renderStart;
    logger.debug("useEventForm effect completed", {
      mode,
      duration: renderTime,
      eventKey,
    });
  }, [mode, eventKey, eventStartDateStr, eventEndDateStr]);

  // Enhanced start date handler with end date validation
  const handleStartDateChange = (newStartDate: Date) => {
    logger.debug("Start date changing", {
      oldDate: startDate.toISOString(),
      newDate: newStartDate.toISOString(),
    });

    setStartDate(newStartDate);

    // Ensure end date is after start date
    if (endDate < newStartDate) {
      const newEndDate = setTimeOnDate(
        newStartDate,
        getSafeHours(endDate),
        getSafeMinutes(endDate),
      );
      logger.debug("Adjusting end date to maintain validity", {
        newEndDate: newEndDate.toISOString(),
      });
      setEndDate(newEndDate);
    }
  };

  // Enhanced end date handler with start date validation
  const handleEndDateChange = (newEndDate: Date) => {
    logger.debug("End date changing", {
      oldDate: endDate.toISOString(),
      newDate: newEndDate.toISOString(),
    });

    if (newEndDate >= startDate) {
      setEndDate(newEndDate);
    } else {
      // Adjust to start date time if trying to set before start
      const adjustedDate = setTimeOnDate(
        startDate,
        getSafeHours(newEndDate),
        getSafeMinutes(newEndDate),
      );
      logger.debug("Adjusting end date to maintain validity", {
        adjustedDate: adjustedDate.toISOString(),
      });
      setEndDate(adjustedDate);
    }
  };

  // All-day toggle handler
  const handleAllDayToggle = (newIsAllDay: boolean) => {
    logger.debug("All-day toggle changing", {
      oldValue: isAllDay,
      newValue: newIsAllDay,
    });

    setIsAllDay(newIsAllDay);

    if (newIsAllDay) {
      // Convert to all-day event: set start to 00:00 and end to 23:59
      const allDayStart = setTimeOnDate(startDate, 0, 0);
      const allDayEnd = setTimeOnDate(startDate, 23, 59);
      
      logger.debug("Converting to all-day event", {
        newStartDate: allDayStart.toISOString(),
        newEndDate: allDayEnd.toISOString(),
      });
      
      setStartDate(allDayStart);
      setEndDate(allDayEnd);
    } else {
      // Convert from all-day to timed event: set reasonable default times
      const timedStart = setTimeOnDate(startDate, 9, 0); // 9:00 AM
      const timedEnd = setTimeOnDate(startDate, 10, 0);   // 10:00 AM (1 hour duration)
      
      logger.debug("Converting to timed event", {
        newStartDate: timedStart.toISOString(),
        newEndDate: timedEnd.toISOString(),
      });
      
      setStartDate(timedStart);
      setEndDate(timedEnd);
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    const submitStart = performance.now();
    logger.info("Form submission started", {
      mode,
      title,
      hasEvent: !!event,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    e.preventDefault();

    // Validation
    if (!title || !startDate || !endDate) {
      logger.warn("Missing required fields in form submission", {
        title: !!title,
        startDate: !!startDate,
        endDate: !!endDate,
      });
      return;
    }

    if (
      !validateDate(startDate, "handleSubmit startDate") ||
      !validateDate(endDate, "handleSubmit endDate")
    ) {
      logger.error("Invalid dates provided in form submission");
      return;
    }

    const { startDate: validStart, endDate: validEnd } = ensureValidDateRange(
      startDate,
      endDate,
    );

    if (validEnd < validStart) {
      logger.error("End date must be after start date", {
        startDate: validStart.toISOString(),
        endDate: validEnd.toISOString(),
      });
      return;
    }

    // Build event data
    const eventData: CalendarEvent = {
      id:
        mode === "edit" && event?.id
          ? event.id
          : Math.floor(Math.random() * 1000),
      title,
      startDate: validStart,
      endDate: validEnd,
      timezone,
      color: COLOR_MAP[calendar],
      description,
      location,
      attendees: attendees
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a),
      organizer: mode === "edit" && event?.organizer ? event.organizer : "You",
      isAllDay,
    };

    logger.info("Event data prepared for submission", {
      eventId: eventData.id,
      mode,
      title: eventData.title,
      startDate: eventData.startDate.toISOString(),
      endDate: eventData.endDate.toISOString(),
    });

    try {
      // Save the event
      if (onModify && mode === "edit") {
        onModify(eventData);
      }
      onSaveAction(eventData);
      onCloseAction();

      // Reset form for create mode
      if (mode === "create") {
        logger.debug("Resetting form state after successful creation");
        setTitle("");
        setLocation("");
        setDescription("");
        setAttendees("");
        const now = createSafeDate();
        setStartDate(now);
        const newEndDate = setTimeOnDate(
          now,
          getSafeHours(now) + 1,
          getSafeMinutes(now),
        );
        setEndDate(newEndDate);
      }

      const submitTime = performance.now() - submitStart;
      logger.info("Form submission completed successfully", {
        eventId: eventData.id,
        mode,
        duration: submitTime,
      });
    } catch (error) {
      logger.error("Form submission failed", error, {
        mode,
        eventData: {
          id: eventData.id,
          title: eventData.title,
          startDate: eventData.startDate.toISOString(),
          endDate: eventData.endDate.toISOString(),
        },
      });
    }
  };

  return {
    // Form state
    startDate,
    endDate,
    title,
    location,
    description,
    attendees,
    calendar,
    timezone,
    isAllDay,

    // State setters
    setTitle,
    setLocation,
    setDescription,
    setAttendees,
    setCalendar,
    setTimezone,
    setIsAllDay,

    // Enhanced date handlers
    handleStartDateChange,
    handleEndDateChange,
    handleAllDayToggle,

    // Form submission
    handleSubmit,

    // Constants
    calendarOptions: CALENDAR_OPTIONS,
    colorMap: COLOR_MAP,
  };
}
