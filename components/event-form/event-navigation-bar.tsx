"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Logger } from "@/utils/logger";

const logger = new Logger("EventNavigationBar", true);

interface EventNavigationBarProps {
  eventIndex: number;
  eventCount: number;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  className?: string;
}

export function EventNavigationBar({
  eventIndex,
  eventCount,
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
  className = "",
}: EventNavigationBarProps) {
  logger.debug("EventNavigationBar render", {
    eventIndex,
    eventCount,
    canPrev,
    canNext,
  });

  const handlePrevious = () => {
    logger.debug("Previous event clicked", { eventIndex, canPrev });
    if (onPrev && canPrev) {
      onPrev();
    }
  };

  const handleNext = () => {
    logger.debug("Next event clicked", { eventIndex, canNext });
    if (onNext && canNext) {
      onNext();
    }
  };

  return (
    <div
      className={`flex justify-between items-center px-4 py-2 border-b border-white/10 bg-black/10 ${className}`}
    >
      <Button
        onClick={handlePrevious}
        disabled={!canPrev}
        className="bg-white/10 text-white flex items-center justify-center disabled:opacity-50"
        aria-label="Previous event"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </Button>

      <span className="text-white/70 text-sm">
        Event {eventIndex + 1} of {eventCount}
      </span>

      <Button
        onClick={handleNext}
        disabled={!canNext}
        className="bg-white/10 text-white flex items-center justify-center disabled:opacity-50"
        aria-label="Next event"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </Button>
    </div>
  );
}
