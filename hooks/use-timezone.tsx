"use client";

import { useState, useEffect, useMemo } from "react";
import { getTimezoneOffset } from "date-fns-tz";

export interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
}

export function useTimezone() {
  const [browserTimezone, setBrowserTimezone] = useState<string>("");

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setBrowserTimezone(detectedTimezone);
  }, []);

  const commonTimezones = useMemo<TimezoneInfo[]>(() => {
    const timezones = [
      "Europe/Rome",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Madrid",
      "Europe/Amsterdam",
      "Europe/Vienna",
      "Europe/Zurich",
      "America/New_York",
      "America/Los_Angeles",
      "America/Chicago",
      "America/Denver",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Australia/Sydney",
      "Pacific/Auckland",
      "UTC",
    ];

    const now = new Date();

    return timezones
      .map((tz) => {
        try {
          const offset = getTimezoneOffset(tz, now);
          const hours = Math.floor(Math.abs(offset) / (1000 * 60 * 60));
          const minutes = Math.floor(
            (Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60),
          );
          const sign = offset <= 0 ? "+" : "-";
          const offsetString = `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

          return {
            value: tz,
            label: `${tz.replace("_", " ")} (${offsetString})`,
            offset: offsetString,
          };
        } catch (error) {
          return {
            value: tz,
            label: tz.replace("_", " "),
            offset: "UTC+00:00",
          };
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const allTimezones = useMemo(() => {
    if (!browserTimezone) return commonTimezones;

    const browserExists = commonTimezones.some(
      (tz) => tz.value === browserTimezone,
    );
    if (browserExists) return commonTimezones;

    try {
      const now = new Date();
      const offset = getTimezoneOffset(browserTimezone, now);
      const hours = Math.floor(Math.abs(offset) / (1000 * 60 * 60));
      const minutes = Math.floor(
        (Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60),
      );
      const sign = offset <= 0 ? "+" : "-";
      const offsetString = `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      const browserTz: TimezoneInfo = {
        value: browserTimezone,
        label: `${browserTimezone.replace("_", " ")} (${offsetString}) - Browser Default`,
        offset: offsetString,
      };

      return [browserTz, ...commonTimezones];
    } catch (error) {
      return commonTimezones;
    }
  }, [browserTimezone, commonTimezones]);

  const formatTimezoneOffset = (
    timezone: string,
    date: Date = new Date(),
  ): string => {
    try {
      const offset = getTimezoneOffset(timezone, date);
      const hours = Math.floor(Math.abs(offset) / (1000 * 60 * 60));
      const minutes = Math.floor(
        (Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60),
      );
      const sign = offset <= 0 ? "+" : "-";
      return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    } catch (error) {
      return "UTC+00:00";
    }
  };

  return {
    browserTimezone,
    allTimezones,
    commonTimezones,
    formatTimezoneOffset,
  };
}
