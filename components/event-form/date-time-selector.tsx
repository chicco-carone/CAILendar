"use client";

import React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  createSafeDate,
  setTimeOnDate,
  getSafeHours,
  getSafeMinutes,
  validateDate,
} from "@/utils/date-utils";
import { Logger } from "@/utils/logger";

const logger = new Logger("DateTimeSelector", true);

interface DateTimeSelectorProps {
  label: string;
  icon: React.ReactNode;
  date: Date;
  onDateChange: (date: Date) => void;
  isAllDay: boolean;
  minDate?: Date;
  className?: string;
}

export function DateTimeSelector({
  label,
  icon,
  date,
  onDateChange,
  isAllDay,
  minDate,
  className = "",
}: DateTimeSelectorProps) {
  logger.debug("DateTimeSelector render", {
    label,
    date: date?.toISOString(),
    isAllDay,
  });

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;

    const safeDate = createSafeDate(newDate);
    const updatedDate = setTimeOnDate(
      safeDate,
      getSafeHours(date),
      getSafeMinutes(date),
    );

    logger.debug("Date changed", {
      label,
      oldDate: date?.toISOString(),
      newDate: updatedDate?.toISOString(),
    });

    onDateChange(updatedDate);
  };

  const handleTimeChange = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(":").map(Number);

    if (!validateDate(date, `${label} time change`)) {
      logger.warn("Invalid date for time change", { label, date });
      return;
    }

    const updatedDate = setTimeOnDate(date, hours, minutes);

    logger.debug("Time changed", {
      label,
      timeValue,
      updatedDate: updatedDate?.toISOString(),
    });

    onDateChange(updatedDate);
  };

  // Generate time slots (every 15 minutes)
  const timeSlots = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon}
      <div className="flex w-full gap-2">
        <div className={isAllDay ? "w-full" : "w-[70%]"}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left font-normal text-white hover:bg-white/20 bg-white/10 border border-white/20 px-3 py-2 h-10"
              >
                {date && !isNaN(date.getTime())
                  ? format(date, "EEE d MMM yyyy")
                  : `Select ${label.toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
                disabled={(calendarDate) => {
                  if (!minDate) return false;
                  if (!validateDate(minDate, "calendar disabled check"))
                    return false;
                  const minDateOnly = setTimeOnDate(minDate, 0, 0);
                  return calendarDate < minDateOnly;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        {!isAllDay && (
          <div className="w-[30%]">
            <Select
              value={
                date && !isNaN(date.getTime()) ? format(date, "HH:mm") : "08:00"
              }
              onValueChange={handleTimeChange}
            >
              <SelectTrigger className="bg-white/10 border border-white/20 text-white w-full px-3 py-2 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((timeString) => (
                  <SelectItem key={timeString} value={timeString}>
                    {timeString}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
