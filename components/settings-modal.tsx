"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SettingsModalProps } from "@/utils/types";

export function SettingsModal({
  isOpen,
  onCloseAction,
  currentView,
  onViewChangeAction,
}: Omit<SettingsModalProps, "onClose" | "onViewChange"> & {
  onCloseAction: () => void;
  onViewChangeAction: (view: "day" | "week" | "month") => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month">(
    currentView,
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedView(currentView);
  }, [currentView]);

  useEffect(() => {
    setHasChanges(selectedView !== currentView);
  }, [selectedView, currentView]);

  const handleViewChange = useCallback((value: string) => {
    setSelectedView(value as "day" | "week" | "month");
  }, []);

  const handleSave = useCallback(() => {
    if (selectedView !== currentView) {
      onViewChangeAction(selectedView);
    }
    onCloseAction();
  }, [selectedView, currentView, onViewChangeAction, onCloseAction]);

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div
        className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        style={{ minHeight: 520, maxHeight: 600, height: 520 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseAction}
            className="text-foreground hover:bg-white/10"
            type="button"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-transparent dark:scrollbar-thumb-zinc-700 dark:scrollbar-track-transparent">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="mb-6 bg-white/10 dark:bg-white/5">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Theme</h3>
                <p className="text-muted-foreground">
                  Choose how the calendar looks for you. Select a theme or sync
                  with your system.
                </p>

                <div className="grid gap-6">
                  <RadioGroup
                    defaultValue={theme}
                    onValueChange={(value) =>
                      setTheme(value as "light" | "dark" | "system")
                    }
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="light"
                        id="theme-light"
                        className="peer sr-only"
                        aria-label="Light theme"
                      />
                      <Label
                        htmlFor="theme-light"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                          theme === "light" ? "border-primary" : "border-muted",
                        )}
                      >
                        <div className="mb-3 rounded-md border border-muted p-2 bg-[#f8fafc]">
                          <div className="space-y-2">
                            <div className="h-2 w-[60px] sm:w-[80px] rounded-lg bg-[#e2e8f0]" />
                            <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-[#e2e8f0]" />
                            <div className="h-2 w-[40px] sm:w-[60px] rounded-lg bg-[#e2e8f0]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Sun className="h-4 w-4 min-w-4 min-h-4" />
                          <span className="text-xs sm:text-sm">Light</span>
                        </div>
                        {theme === "light" && (
                          <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="dark"
                        id="theme-dark"
                        className="peer sr-only"
                        aria-label="Dark theme"
                      />
                      <Label
                        htmlFor="theme-dark"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-zinc-950 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                          theme === "dark" ? "border-primary" : "border-muted",
                        )}
                      >
                        <div className="mb-3 rounded-md border border-zinc-800 p-2 bg-zinc-900">
                          <div className="space-y-2">
                            <div className="h-2 w-[60px] sm:w-[80px] rounded-lg bg-zinc-700" />
                            <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-zinc-700" />
                            <div className="h-2 w-[40px] sm:w-[60px] rounded-lg bg-zinc-700" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-white">
                          <Moon className="h-4 w-4 min-w-4 min-h-4" />
                          <span className="text-xs sm:text-sm">Dark</span>
                        </div>
                        {theme === "dark" && (
                          <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="system"
                        id="theme-system"
                        className="peer sr-only"
                        aria-label="System theme"
                      />
                      <Label
                        htmlFor="theme-system"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gradient-to-br from-white to-zinc-900 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                          theme === "system"
                            ? "border-primary"
                            : "border-muted",
                        )}
                      >
                        <div className="mb-3 rounded-md border border-muted p-2 bg-gradient-to-br from-[#f8fafc] to-zinc-900">
                          <div className="space-y-2">
                            <div className="h-2 w-[60px] sm:w-[80px] rounded-lg bg-gradient-to-r from-[#e2e8f0] to-zinc-700" />
                            <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-gradient-to-r from-[#e2e8f0] to-zinc-700" />
                            <div className="h-2 w-[40px] sm:w-[60px] rounded-lg bg-gradient-to-r from-[#e2e8f0] to-zinc-700" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Monitor className="h-4 w-4 min-w-4 min-h-4" />
                          <span className="text-xs sm:text-sm">System</span>
                        </div>
                        {theme === "system" && (
                          <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">
                  Calendar View
                </h3>
                <p className="text-muted-foreground">
                  Choose your default calendar view.
                </p>

                <RadioGroup
                  value={selectedView}
                  onValueChange={handleViewChange}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="day"
                      id="view-day"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="view-day"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        selectedView === "day"
                          ? "border-primary"
                          : "border-muted",
                      )}
                    >
                      <div className="mb-2 h-20 w-full rounded-md border border-muted bg-background/50 p-1">
                        <div className="h-full w-full rounded bg-muted/50"></div>
                      </div>
                      <span className="text-foreground">Day</span>
                      {selectedView === "day" && (
                        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="week"
                      id="view-week"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="view-week"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        selectedView === "week"
                          ? "border-primary"
                          : "border-muted",
                      )}
                    >
                      <div className="mb-2 h-20 w-full rounded-md border border-muted bg-background/50 p-1">
                        <div className="grid h-full grid-cols-7 gap-px">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="rounded bg-muted/50"></div>
                          ))}
                        </div>
                      </div>
                      <span className="text-foreground">Week</span>
                      {selectedView === "week" && (
                        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="month"
                      id="view-month"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="view-month"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        selectedView === "month"
                          ? "border-primary"
                          : "border-muted",
                      )}
                    >
                      <div className="mb-2 h-20 w-full rounded-md border border-muted bg-background/50 p-1">
                        <div className="grid h-full grid-cols-7 grid-rows-4 gap-px">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} className="rounded bg-muted/50"></div>
                          ))}
                        </div>
                      </div>
                      <span className="text-foreground">Month</span>
                      {selectedView === "month" && (
                        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">
                  Notifications
                </h3>
                <p className="text-muted-foreground">
                  Configure how you want to be notified about calendar events.
                </p>
                <div className="rounded-lg border border-muted p-6 bg-white/10 dark:bg-black/20 backdrop-blur-sm text-foreground">
                  <p className="text-center text-muted-foreground">
                    Notification settings will be available soon.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Privacy</h3>
                <p className="text-muted-foreground">
                  Manage your privacy settings and data.
                </p>
                <div className="rounded-lg border border-muted p-6 bg-white/10 dark:bg-black/20 backdrop-blur-sm text-foreground">
                  <p className="text-center text-muted-foreground">
                    Privacy settings will be available soon.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-white/20">
          <Button
            variant="outline"
            onClick={onCloseAction}
            className="border-white/20 text-foreground"
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className={cn(
              "bg-blue-500 hover:bg-blue-600 text-white",
              !hasChanges && "opacity-70 cursor-default hover:bg-blue-500",
            )}
            disabled={!hasChanges}
            type="button"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
