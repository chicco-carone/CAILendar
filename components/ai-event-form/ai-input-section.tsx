"use client";

import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AIInputSectionProps } from "@/utils/types";

export function AIInputSection({
  prompt,
  onPromptChange,
  onMicClick,
  listening,
  browserSupportsSpeechRecognition,
}: AIInputSectionProps) {
  return (
    <div>
      <p className="text-sm text-white/70 mb-2">
        Describe your event or upload an image, and AI will help
        create it for you.
      </p>
      <div className="relative">
        <Textarea
          placeholder="Describe your event... (e.g., 'Team meeting with marketing department to discuss Q3 campaign strategy')"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px] pr-12"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "absolute top-2 right-2 bg-black/30 hover:bg-black/50",
                    listening && "bg-purple-600 animate-pulse",
                    !browserSupportsSpeechRecognition &&
                      "bg-red-700/80 hover:bg-red-800/90"
                  )}
                  onClick={onMicClick}
                  aria-label={
                    listening ? "Stop recording" : "Start recording"
                  }
                  disabled={!browserSupportsSpeechRecognition}
                >
                  <Mic
                    className={cn(
                      "h-5 w-5",
                      !browserSupportsSpeechRecognition &&
                        "text-red-400 animate-pulse"
                    )}
                  />
                </Button>
              </span>
            </TooltipTrigger>
            {!browserSupportsSpeechRecognition && (
              <TooltipContent side="top">
                Il riconoscimento vocale non è supportato sui browser
                non Chromium-based.
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
