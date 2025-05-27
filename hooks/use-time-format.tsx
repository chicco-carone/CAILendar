import { useState, useEffect } from "react";

type TimeFormat = "12h" | "24h";

export function useTimeFormat(initialFormat: TimeFormat = "12h") {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    const savedFormat =
      typeof window !== "undefined" ? localStorage.getItem("timeFormat") : null;
    return (savedFormat as TimeFormat) || initialFormat;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("timeFormat", timeFormat);
    }
  }, [timeFormat]);

  const formatTime = (time: string): string => {
    if (timeFormat === "24h") return time;

    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatHour = (hour: number): string => {
    if (timeFormat === "24h") return hour.toString().padStart(2, "0");

    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return {
    timeFormat,
    setTimeFormat,
    formatTime,
    formatHour,
  };
}
