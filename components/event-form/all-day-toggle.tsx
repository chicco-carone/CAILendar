"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Logger } from "@/utils/logger";

const logger = new Logger("AllDayToggle", true);

interface AllDayToggleProps {
  isAllDay: boolean;
  onToggle: (isAllDay: boolean) => void;
  className?: string;
}

export function AllDayToggle({
  isAllDay,
  onToggle,
  className = "",
}: AllDayToggleProps) {
  logger.debug("AllDayToggle render", { isAllDay });

  const handleToggle = () => {
    const newValue = !isAllDay;
    logger.debug("All day toggle clicked", {
      oldValue: isAllDay,
      newValue,
    });
    onToggle(newValue);
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-white/70" />
        <span className="text-white text-sm">All day</span>
      </div>

      <label
        htmlFor="all-day-switch"
        className="flex items-center cursor-pointer"
      >
        <div className="relative">
          <input
            type="checkbox"
            id="all-day-switch"
            className="sr-only"
            checked={isAllDay}
            onChange={handleToggle}
          />
          <div
            className={`block w-10 h-6 rounded-full transition-colors ${
              isAllDay ? "bg-pink-500" : "bg-gray-600"
            }`}
          />
          <div
            className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
              isAllDay ? "translate-x-full" : ""
            }`}
          />
        </div>
      </label>
    </div>
  );
}
