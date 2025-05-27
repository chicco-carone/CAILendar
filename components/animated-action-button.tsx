"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ActionButtonProps } from "@/utils/types";

export function AnimatedActionButton({
  onAddEventAction,
  onAddEventWithAIAction,
  className,
  collapsed,
}: {
  onAddEventAction: () => void;
  onAddEventWithAIAction: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAddEvent = () => {
    setIsOpen(false);
    onAddEventAction();
  };

  const handleAddEventWithAI = () => {
    setIsOpen(false);
    onAddEventWithAIAction();
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <Button
        onClick={toggleMenu}
        className={cn(
          "flex items-center justify-center rounded-full bg-blue-500 p-2 text-white w-9 h-9 hover:bg-blue-600 transition-all duration-300",
          isOpen && "rotate-45",
        )}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </Button>

      {/* Action buttons with motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="actions"
            className="absolute bottom-0 right-full mr-2 flex flex-col items-end gap-2 z-50"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{
                delay: 0.05,
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            >
              <Button
                onClick={handleAddEventWithAI}
                className={cn(
                  "flex items-center gap-2 rounded-full bg-purple-500 text-white px-4 py-2 hover:bg-purple-600 shadow-lg max-w-xs truncate",
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span className="truncate">Add Event with AI</span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{
                delay: 0.12,
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            >
              <Button
                onClick={handleAddEvent}
                className={cn(
                  "flex items-center gap-2 rounded-full bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 shadow-lg max-w-xs truncate",
                )}
              >
                <Calendar className="h-4 w-4" />
                <span className="truncate">Add Event</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
