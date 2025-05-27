import { MiniCalendar } from "@/components/mini-calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { AnimatedActionButton } from "@/components/animated-action-button";
import { myCalendars } from "@/utils/mockData";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import type { SidebarProps } from "@/utils/types";

export const Sidebar: React.FC<SidebarProps> = ({
  isLoaded,
  currentDate,
  onDateSelect,
  onMonthChange,
  onAddEvent,
  onAddEventWithAI,
  onConnectionsOpen,
  collapsed = false,
}) => {
  const isMobile = useIsMobile();
  const autoCollapsed = collapsed;
  return (
    <motion.div
      initial={{ width: autoCollapsed ? 64 : 256, opacity: 0 }}
      animate={{ width: autoCollapsed ? 64 : 256, opacity: isLoaded ? 1 : 0 }}
      transition={{
        width: { duration: 0.3 },
        opacity: { duration: 0.4, delay: 0.4 },
      }}
      className={`relative h-[calc(100vh-80px)] bg-white/80 dark:bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-gray-200 dark:border-white/20 rounded-tr-3xl flex flex-col justify-between transition-colors overflow-hidden ${
        autoCollapsed ? "w-16" : "w-64"
      }`}
      style={{ minWidth: 0 }}
    >
      <div className={autoCollapsed ? "hidden" : ""}>
        {/* Mini Calendar */}
        <MiniCalendar
          onDateSelect={onDateSelect}
          onMonthChange={onMonthChange}
          currentDate={currentDate}
        />

        {/* My Calendars */}
        <div>
          <h3 className="text-gray-700 dark:text-white font-medium mb-3">
            My calendars
          </h3>
          <div className="space-y-2">
            {myCalendars.map((cal, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                <span className="text-gray-700 dark:text-white text-sm">
                  {cal.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connections Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full justify-start text-left border-gray-200 dark:border-white/20 text-gray-700 dark:text-white"
            onClick={onConnectionsOpen}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar Connections
          </Button>
        </div>
      </div>

      {/* Animated Action Button */}
      {/* Rimosso AnimatedActionButton dalla sidebar */}
    </motion.div>
  );
};
