"use client";

import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AIFormActionsProps } from "@/utils/types";

export function AIFormActions({
  onCancel,
  onSubmit,
  loading,
  showLoadingScreen,
  hasInput,
}: AIFormActionsProps) {
  return (
    <div className="flex justify-end gap-2 p-4 border-t border-white/20">
      <Button
        variant="outline"
        onClick={onCancel}
        className="border-white/20 text-white hover:bg-white/10"
      >
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        disabled={loading || showLoadingScreen || !hasInput}
        className="bg-purple-500 hover:bg-purple-600 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Event
          </>
        )}
      </Button>
    </div>
  );
}
