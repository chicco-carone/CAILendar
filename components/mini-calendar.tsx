"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import "react-calendar/dist/Calendar.css";
import "@/styles/react-calendar.css";
import type { MiniCalendarProps } from "@/utils/types";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export function MiniCalendar({
  onDateSelect,
  onMonthChange,
  currentDate = new Date(),
}: MiniCalendarProps) {
  const [value, setValue] = useState<Value>(currentDate);
  const [activeStartDate, setActiveStartDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
  );
  const [monthDisplay, setMonthDisplay] = useState(
    format(currentDate, "MMMM yyyy"),
  );

  useEffect(() => {
    setValue(currentDate);

    if (!isSameMonth(activeStartDate, currentDate)) {
      setActiveStartDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      );
      setMonthDisplay(format(currentDate, "MMMM yyyy"));
    }
  }, [currentDate, activeStartDate]);

  const handleDateChange = (nextValue: Value) => {
    setValue(nextValue);

    if (nextValue instanceof Date && onDateSelect) {
      onDateSelect(nextValue);
    }
  };

  const handleViewChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      setActiveStartDate(activeStartDate);
      setMonthDisplay(format(activeStartDate, "MMMM yyyy"));

      if (onMonthChange) {
        onMonthChange(activeStartDate);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-medium">{monthDisplay}</h3>
      </div>

      <div
        className={cn(
          "react-calendar-wrapper",
          "bg-background/50 backdrop-blur-sm rounded-lg p-2 border border-border/50",
          "transition-colors duration-200",
        )}
      >
        <Calendar
          onChange={handleDateChange}
          value={value}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={handleViewChange}
          locale="it-IT"
          prevLabel={<ChevronLeft className="h-4 w-4" />}
          nextLabel={<ChevronRight className="h-4 w-4" />}
          prev2Label={null}
          next2Label={null}
          showNeighboringMonth={true}
          minDetail="month"
          maxDetail="month"
        />
      </div>
    </div>
  );
}
