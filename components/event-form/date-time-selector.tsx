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
import { motion, AnimatePresence } from "framer-motion";
import { useTimeFormat } from "@/hooks/use-time-format";

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
  const { timeFormat, formatTime } = useTimeFormat();
  
  logger.debug("DateTimeSelector render", {
    label,
    date: date?.toISOString(),
    isAllDay,
    timeFormat,
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
    if (!timeValue || typeof timeValue !== 'string') {
      logger.warn("Invalid timeValue provided", { label, timeValue });
      return;
    }

    if (!validateDate(date, `${label} time change`)) {
      logger.warn("Invalid date for time change", { label });
      return;
    }
    
    try {
      let time24h: string;
      
      if (timeFormat === "12h" && timeValue.includes(" ")) {
        const [timepart, period] = timeValue.split(" ");
        if (!timepart || !period) {
          logger.warn("Invalid 12h format", { timeValue });
          return;
        }
        
        const [hourStr, minuteStr] = timepart.split(":");
        if (!hourStr || !minuteStr) {
          logger.warn("Invalid time format", { timeValue });
          return;
        }
        
        const hour = parseInt(hourStr, 10);
        const minutes = parseInt(minuteStr, 10);
        
        if (isNaN(hour) || isNaN(minutes) || hour < 1 || hour > 12 || minutes < 0 || minutes > 59) {
          logger.warn("Invalid time values", { hour, minutes, timeValue });
          return;
        }
        
        let hour24 = hour;
        if (period === "PM" && hour !== 12) {
          hour24 += 12;
        } else if (period === "AM" && hour === 12) {
          hour24 = 0;
        }
        
        time24h = `${hour24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      } else {
        time24h = timeValue;
      }

      const [hourStr, minuteStr] = time24h.split(":");
      if (!hourStr || !minuteStr) {
        logger.warn("Invalid 24h time format", { time24h });
        return;
      }
      
      const hours = parseInt(hourStr, 10);
      const minutes = parseInt(minuteStr, 10);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        logger.warn("Invalid parsed time values", { hours, minutes, time24h });
        return;
      }

      const updatedDate = setTimeOnDate(date, hours, minutes);
      
      if (!validateDate(updatedDate, "updated date after time change")) {
        logger.error("Failed to create valid updated date", { hours, minutes });
        return;
      }

      onDateChange(updatedDate);
    } catch (error) {
      logger.error("Error in handleTimeChange", { 
        error: error instanceof Error ? error.message : String(error),
        timeValue 
      });
    }
  };

  const timeSlots = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const time24h = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    
    if (timeFormat === "12h") {
      return formatTime(time24h);
    }
    return time24h;
  });
  
  const getCurrentTimeValue = () => {
    if (!date || isNaN(date.getTime())) {
      logger.warn("Invalid date in getCurrentTimeValue", { date });
      return timeFormat === "12h" ? "8:00 AM" : "08:00";
    }
    
    try {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      const totalMinutes = hours * 60 + minutes;
      const roundedMinutes = Math.round(totalMinutes / 15) * 15;
      const roundedHours = Math.floor(roundedMinutes / 60) % 24;
      const roundedMins = roundedMinutes % 60;
      
      const time24h = `${roundedHours.toString().padStart(2, "0")}:${roundedMins.toString().padStart(2, "0")}`;
      
      const timeValue = timeFormat === "12h" ? formatTime(time24h) : time24h;
      
      logger.debug("getCurrentTimeValue result", {
        date: date.toISOString(),
        originalHours: hours,
        originalMinutes: minutes,
        roundedTime: time24h,
        timeValue,
        timeFormat
      });
      
      return timeValue;
    } catch (error) {
      logger.error("Error in getCurrentTimeValue", { error, date });
      return timeFormat === "12h" ? "8:00 AM" : "08:00";
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon}
      <motion.div 
        className="flex w-full gap-2"
        layout
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 35,
          duration: 0.4
        }}
      >
        <motion.div 
          className={isAllDay ? "w-full" : "w-[70%]"}
          layout
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 35,
            duration: 0.4
          }}
        >
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
        </motion.div>
        <motion.div 
          className="w-[30%]"
          layout
          animate={{
            opacity: isAllDay ? 0 : 1,
            scale: isAllDay ? 0.8 : 1,
            width: isAllDay ? 0 : "30%"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 35,
            duration: 0.4
          }}
          style={{ 
            overflow: "hidden",
            transformOrigin: "right center"
          }}
        >
          {!isAllDay && (
            <Select
              value={getCurrentTimeValue()}
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
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
