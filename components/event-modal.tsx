"use client";

import type React from "react";
import { BiSolidCalendarPlus, BiCalendarCheck } from "react-icons/bi";
import type { EventModalProps } from "@/utils/types";
import { useEventForm } from "@/hooks/use-event-form";
import { ModalHeader } from "@/components/event-form/modal-header";
import { EventNavigationBar } from "@/components/event-form/event-navigation-bar";
import { EventFormFields } from "@/components/event-form/event-form-fields";
import { DateTimeSelector } from "@/components/event-form/date-time-selector";
import { TimezoneSelector } from "@/components/event-form/timezone-selector";
import { AllDayToggle } from "@/components/event-form/all-day-toggle";
import { FormActions } from "@/components/event-form/form-actions";
import { Logger } from "@/utils/logger";

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
}: EventModalProps) {
  const renderStart = performance.now();

  logger.debug("EventModal render", {
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
    timezone,
    isAllDay,
    setTitle,
    setLocation,
    setDescription,
    setAttendees,
    setTimezone,
    setIsAllDay,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
  } = useEventForm({
    mode,
    event,
    onSaveAction,
    onModify,
    onCloseAction,
  });

  // Early return if modal is not open
  if (!isOpen) return null;

  // Show multi-event navigation bar when applicable
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
        {/* Modal Header */}
        <div className="flex flex-col">
          <ModalHeader mode={mode} onClose={onCloseAction} />

          {/* Event Navigation Bar (conditional) */}
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

        {/* Event Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Form Fields Section */}
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

          {/* All Day Toggle */}
          <AllDayToggle isAllDay={isAllDay} onToggle={setIsAllDay} />

          {/* Date and Time Selectors */}
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

          {/* Timezone Selector */}
          <TimezoneSelector
            timezone={timezone}
            onTimezoneChange={setTimezone}
          />

          {/* Form Actions */}
          <FormActions mode={mode} onDelete={onDelete} canDelete={!!onDelete} />
        </form>
      </div>
    </div>
  );
}
