"use client";

import React from "react";
import { AlertTriangle, X, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { AIAlertsSectionProps, AIConflictInfo } from "@/utils/types";

export function AIAlertsSection({
  error,
  warnings,
  conflicts,
  showWarnings,
  onClearError,
  onHideWarnings,
}: AIAlertsSectionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return AlertTriangle;
      case "medium":
        return Clock;
      case "low":
        return Info;
      default:
        return Info;
    }
  };

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="p-4 pb-0">
          <Alert className="bg-red-500/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearError}
                className="ml-2 text-white hover:bg-white/10"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Warnings Display */}
      {warnings.length > 0 && showWarnings && (
        <div className="p-4 pb-0">
          <Alert className="bg-yellow-500/20 border-yellow-500/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-white">
              <div className="flex justify-between items-start">
                <div>
                  <strong>AI Processing Warnings:</strong>
                  <ul className="mt-1 text-sm">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onHideWarnings}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Conflicts Display */}
      {conflicts.length > 0 && (
        <div className="p-4 pb-0">
          <Alert className="bg-orange-500/20 border-orange-500/50">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-white">
              <strong>Scheduling Conflicts Detected:</strong>
              <div className="mt-2 space-y-2">
                {conflicts.map((conflict, idx) => {
                  const SeverityIcon = getSeverityIcon(conflict.severity);
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <Badge
                        className={`${getSeverityColor(conflict.severity)} text-white`}
                      >
                        <SeverityIcon className="h-3 w-3 mr-1" />
                        {conflict.severity}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">
                          {conflict.eventTitle}
                        </div>
                        <div className="text-white/80">
                          {conflict.suggestion}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
