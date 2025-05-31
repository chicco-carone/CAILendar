"use client";

import React from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AIModalHeaderProps } from "@/utils/types";

export function AIModalHeader({ onClose, metadata }: AIModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/20">
      <h2 className="text-xl font-semibold text-white flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
        Create Event with AI
        {metadata && (
          <Badge variant="outline" className="ml-2 text-xs">
            {metadata.parsingMethod}
          </Badge>
        )}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="text-white hover:bg-white/10"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
