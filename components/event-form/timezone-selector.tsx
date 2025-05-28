"use client";

import React from "react";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimezone } from "@/hooks/use-timezone";
import { Logger } from "@/utils/logger";

const logger = new Logger("TimezoneSelector", true);

interface TimezoneSelectorProps {
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  className?: string;
}

export function TimezoneSelector({
  timezone,
  onTimezoneChange,
  className = "",
}: TimezoneSelectorProps) {
  const { allTimezones } = useTimezone();

  logger.debug("TimezoneSelector render", {
    currentTimezone: timezone,
    availableTimezones: allTimezones.length,
  });

  const handleTimezoneChange = (newTimezone: string) => {
    logger.debug("Timezone changed", {
      oldTimezone: timezone,
      newTimezone,
    });
    onTimezoneChange(newTimezone);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Globe className="h-5 w-5 text-white/70" />
      <Select value={timezone} onValueChange={handleTimezoneChange}>
        <SelectTrigger className="bg-white/10 border border-white/20 text-white w-full px-3 py-2 h-auto focus:ring-pink-500">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto">
          {allTimezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
