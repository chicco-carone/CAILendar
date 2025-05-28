"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Logger } from "@/utils/logger";

const logger = new Logger("FormActions", true);

interface FormActionsProps {
  mode: "create" | "edit";
  onDelete?: () => void;
  canDelete?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export function FormActions({
  mode,
  onDelete,
  canDelete = false,
  isSubmitting = false,
  className = "",
}: FormActionsProps) {
  logger.debug("FormActions render", {
    mode,
    canDelete,
    isSubmitting,
  });

  const handleDelete = () => {
    logger.debug("Delete button clicked", { mode });
    if (onDelete && canDelete) {
      onDelete();
    }
  };

  return (
    <div className={`flex justify-end gap-2 pt-4 ${className}`}>
      {onDelete && mode === "edit" && canDelete && (
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
        >
          Delete
        </Button>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : mode === "create" ? "Save" : "Update"}
      </Button>
    </div>
  );
}
