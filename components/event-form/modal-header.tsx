"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logger } from "@/utils/logger";

const logger = new Logger("ModalHeader", true);

interface ModalHeaderProps {
  mode: "create" | "edit";
  onClose: () => void;
  title?: string;
  className?: string;
}

export function ModalHeader({
  mode,
  onClose,
  title,
  className = "",
}: ModalHeaderProps) {
  const headerTitle =
    title || (mode === "create" ? "Create Event" : "Edit Event");

  logger.debug("ModalHeader render", { mode, title: headerTitle });

  const handleClose = () => {
    logger.debug("Modal close clicked", { mode });
    onClose();
  };

  return (
    <div
      className={`flex items-center justify-between p-4 border-b border-white/20 ${className}`}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="text-white hover:bg-white/10"
        aria-label="Close modal"
      >
        <X className="h-5 w-5" />
      </Button>

      <h2 className="text-xl font-semibold text-white">{headerTitle}</h2>

      {/* Placeholder to keep title centered */}
      <div className="w-10" />
    </div>
  );
}
