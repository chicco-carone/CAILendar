"use client";

import type React from "react";
import { BiSolidCalendarPlus, BiCalendarCheck, BiSolidSelectMultiple } from "react-icons/bi";
import type { EventModalProps, UserCalendar } from "@/utils/types";
import { useEventForm } from "@/hooks/use-event-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModalHeader } from "@/components/event-form/modal-header";
import { EventNavigationBar } from "@/components/event-form/event-navigation-bar";
import { EventFormFields } from "@/components/event-form/event-form-fields";
import { DateTimeSelector } from "@/components/event-form/date-time-selector";
import { TimezoneSelector } from "@/components/event-form/timezone-selector";
import { AllDayToggle } from "@/components/event-form/all-day-toggle";
import { FormActions } from "@/components/event-form/form-actions";
import { Logger } from "@/utils/logger";
import { motion } from "framer-motion";

const logger = new Logger("EventModal", true);

export function EventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
  onDelete,
  onModify,
  event,
  mode = "create",
  onPrev,
  onNext,
  canPrev,
  canNext,
  eventIndex,
  eventCount,
  // Props for calendar selection
  calendars,
  defaultCalendarId,
}: EventModalProps & { calendars?: UserCalendar[]; defaultCalendarId?: string }) {
  const renderStart = performance.now();

  logger.debug("EventModal received props:", {
    mode,
    event,
    calendars,
    defaultCalendarId,
    isOpen,
    eventIndex,
    eventCount,
  });

  logger.debug("EventModal render - initial state check", {
    mode,
    eventId: event?.id,
    isOpen,
    eventIndex,
    eventCount,
  });

  // Use the custom hook for form management
  const {
    startDate,
    endDate,
    title,
    location,
    description,
    attendees,
    calendarId,
    timezone,
    isAllDay,
    isSaving,
    setTitle,
    setLocation,
    setDescription,
    setAttendees,
    setCalendarId,
    setTimezone,
    setIsAllDay,
    handleStartDateChange,
    handleEndDateChange,
    handleAllDayToggle,
    handleSubmit,
    calendarOptions,
  } = useEventForm({
    mode,
    // Pass the event as is for edit mode; for create mode, pass an object with the defaultCalendarId
    event: mode === 'edit' ? event : { calendarId: defaultCalendarId },
    onSaveAction,
    onModify,
    onCloseAction,
    calendars, // Pass calendars to the hook
  });

  logger.debug("EventModal: useEventForm returned", { calendarId, calendarOptions });

  if (!isOpen) return null;

  // Use passed-in calendars if available, otherwise fallback to hook's calendarOptions
  const availableCalendars = calendars && calendars.length > 0 ? calendars : calendarOptions;
  logger.debug("EventModal: availableCalendars for Select", { 
    availableCalendars, 
    calendarsProp: calendars, 
    calendarOptionsFromHook: calendarOptions 
  });

  const showNavigation =
    typeof eventIndex === "number" &&
    typeof eventCount === "number" &&
    eventCount > 1;

  const renderTime = performance.now() - renderStart;
  logger.debug("EventModal render completed", {
    mode,
    eventId: event?.id,
    duration: renderTime,
    showNavigation,
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex flex-col">
          <ModalHeader mode={mode} onClose={onCloseAction} />

          {showNavigation && (
            <EventNavigationBar
              eventIndex={eventIndex!}
              eventCount={eventCount!}
              onPrev={onPrev}
              onNext={onNext}
              canPrev={canPrev}
              canNext={canNext}
            />
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <EventFormFields
            title={title}
            setTitle={setTitle}
            location={location}
            setLocation={setLocation}
            description={description}
            setDescription={setDescription}
            attendees={attendees}
            setAttendees={setAttendees}
          />

          {availableCalendars && availableCalendars.length > 1 && (
            <div className="space-y-2">
              <label htmlFor="calendar-select" className="text-sm font-medium text-white/90">
                Calendar
              </label>
              <Select value={calendarId} onValueChange={(newCalendarId) => {
                logger.debug("EventModal: Calendar Select onValueChange", { newCalendarId, oldCalendarId: calendarId });
                setCalendarId(newCalendarId);
              }}>
                <SelectTrigger id="calendar-select" className="w-full bg-white/5 border-white/20 text-white/90">
                  <BiSolidSelectMultiple className="h-5 w-5 text-white/70 mr-2" />
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800/90 backdrop-blur-md border-white/20 text-white/90">
                  {availableCalendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id} className="hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${cal.color}`}></span>
                        {cal.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <AllDayToggle isAllDay={isAllDay} onToggle={handleAllDayToggle} />

          <motion.div
            layout 
            className="flex flex-col space-y-6"
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3
            }}
          >
            <DateTimeSelector
              label="Start"
              icon={<BiSolidCalendarPlus className="h-5 w-5 text-white/70" />}
              date={startDate}
              onDateChange={handleStartDateChange}
              isAllDay={isAllDay}
            />

            <DateTimeSelector
              label="End"
              icon={<BiCalendarCheck className="h-5 w-5 text-white/70" />}
              date={endDate}
              onDateChange={handleEndDateChange}
              isAllDay={isAllDay}
              minDate={startDate}
            />
          </motion.div>

          <TimezoneSelector
            timezone={timezone}
            onTimezoneChange={setTimezone}
          />

          <FormActions mode={mode} onDelete={onDelete} canDelete={!!onDelete} isSubmitting={isSaving} />
        </form>
      </div>
    </div>
  );
}
