"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Settings,
  Menu,
  X,
  CalendarDays,
  Download,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarView } from "@/components/calendar-view";
import { MiniCalendar } from "@/components/mini-calendar";
import { SettingsModal } from "@/components/settings-modal";
import { ConnectionsModal } from "@/components/connections-modal";
import { EventModal } from "@/components/event-modal";
import { AIEventModal } from "@/components/ai-event-modal";
import { AnimatedActionButton } from "@/components/animated-action-button";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import {
  saveEventsToLocalStorage,
  loadEventsFromLocalStorage,
  downloadEventsAsICS,
} from "@/lib/ical-utils";
import type { CalendarEvent } from "@/utils/types";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { myCalendars, sampleEvents } from "@/utils/mockData";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<
    "day" | "week" | "month" | "agenda"
  >("week");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAIEventModalOpen, setIsAIEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] =
    useState<Partial<CalendarEvent> | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const isMobile = useIsMobile();

  // Debug logs at render time
  console.log("[Page] Rendering component - events count:", events.length);
  console.log("[Page] Sample events count:", sampleEvents.length);
  if (events.length > 0) {
    console.log("[Page] First event:", events[0]);
  }

  useEffect(() => {
    console.log("[Page] useEffect starting...");
    console.log(
      "[Page] Sample events available:",
      sampleEvents.length,
      sampleEvents,
    );
    console.log("[Page] Current events state:", events.length, events);

    // Clear localStorage to ensure we get fresh data
    console.log("[Page] Clearing localStorage");
    localStorage.removeItem("calendar-events");

    // For debugging, let's always start with fresh sample events
    console.log("[Page] Using fresh sample events");
    setEvents(sampleEvents);
    saveEventsToLocalStorage(sampleEvents);

    setIsLoaded(true);
    console.log("[Page] useEffect completed");
  }, []);

  // Track events state changes
  useEffect(() => {
    console.log("[Page] Events state changed:", events.length, events);
  }, [events]);

  const handleEventAdd = (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: eventData.id ?? Date.now(),
      title: eventData.title ?? "",
      startDate: eventData.startDate ?? new Date(),
      endDate: eventData.endDate ?? new Date(),
      timezone:
        eventData.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      color: eventData.color ?? "bg-blue-500",
      description: eventData.description ?? "",
      location: eventData.location ?? "",
      attendees: eventData.attendees ?? [],
      organizer: eventData.organizer ?? "You",
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEventsToLocalStorage(updatedEvents);
    toast({
      title: "Event Created",
      description: `"${newEvent.title}" has been added to your calendar.`,
      duration: 3000,
    });
  };

  const handleEventUpdate = (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return;
    const updatedEvents = events.map((event) =>
      event.id === eventData.id ? { ...event, ...eventData } : event,
    );
    setEvents(updatedEvents);
    saveEventsToLocalStorage(updatedEvents);
    toast({
      title: "Event Updated",
      description: `"${eventData.title ?? "Event"}" has been updated.`,
      duration: 3000,
    });
  };

  const handleEventDelete = (eventId: number | string) => {
    const eventToDelete = events.find((event) => event.id === eventId);

    const updatedEvents = events.filter((event) => event.id !== eventId);
    setEvents(updatedEvents);

    saveEventsToLocalStorage(updatedEvents);

    toast({
      title: "Event Deleted",
      description: eventToDelete
        ? `"${eventToDelete.title}" has been removed.`
        : "Event has been removed.",
      duration: 3000,
    });
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };

  const handleMonthChange = (date: Date) => {
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      currentDate.getDate(),
    );
    setCurrentDate(newDate);
  };

  const handleMainCalendarDateChange = (
    date: Date,
    view: "day" | "week" | "month" | "agenda",
  ) => {
    setCurrentDate(date);
    if (view !== "agenda") {
      setCurrentView(view);
    }
  };

  const handleViewChange = (view: "day" | "week" | "month" | "agenda") => {
    if (view !== "agenda") {
      setCurrentView(view);
    }
  };

  const handleAddEvent = () => {
    const now = new Date();
    const startTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const endHour = (now.getHours() + 1) % 24;
    const endTime =
      endHour.toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const day = now.getDay() || 7;

    const newEvent = {
      id: undefined,
      title: "",
      startTime,
      endTime,
      color: "bg-blue-500",
      day,
      description: "",
      location: "",
      attendees: [],
      organizer: "You",
      date: "",
    };

    setEditingEvent(newEvent);
    setIsEventModalOpen(true);
  };

  const handleAddEventWithAI = () => {
    setIsAIEventModalOpen(true);
  };

  const handleExportCalendar = () => {
    downloadEventsAsICS(events);

    toast({
      title: "Calendar Exported",
      description: "Your calendar has been exported as an .ics file.",
      duration: 3000,
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden transition-colors duration-300 dark:bg-gray-900">
      {/* Background Image - Only visible in dark mode */}
      <div className="dark:block hidden">
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
          alt="Beautiful mountain landscape"
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>

      {/* Light mode background */}
      <div className="dark:hidden block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
      </div>

      {/* Navigation */}
      <div className="w-full flex flex-col items-center">
        {/* Logo allineato a sinistra sopra l'header, senza padding */}
        <div
          className="absolute left-0 top-0 z-20 flex justify-start"
          style={{ width: 220, height: "auto" }}
        >
          {/* Logo desktop - icona e nome separati */}
          <div className="hidden md:flex items-center gap-2">
            <motion.img
              src="/logo.svg"
              alt="Intellical Logo"
              width={85}
              height={40}
              className="drop-shadow-lg cursor-pointer"
              style={{ borderRadius: 8 }}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? "Apri sidebar" : "Chiudi sidebar"}
              animate={{ rotate: sidebarCollapsed ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            />
            <Image
              src="/logo-name-black.svg"
              alt="Intellical"
              width={160}
              height={40}
              className="drop-shadow-lg cursor-pointer dark:hidden"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              priority
            />
            <Image
              src="/logo-name-white.svg"
              alt="Intellical"
              width={160}
              height={40}
              className="drop-shadow-lg cursor-pointer hidden dark:block"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              priority
            />
          </div>
          {/* Logo mobile - solo icona */}
          <motion.img
            src="/logo.svg"
            alt="Intellical Logo"
            width={80}
            height={80}
            className="drop-shadow-lg block md:hidden cursor-pointer"
            style={{ borderRadius: 8 }}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Apri sidebar" : "Chiudi sidebar"}
            animate={{ rotate: sidebarCollapsed ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
        </div>
        <header
          className={`w-full z-10 flex items-start justify-between px-8 pt-4 pb-4 opacity-0 ${
            isLoaded ? "animate-fade-in" : ""
          }`}
          style={{ animationDelay: "0.1s" }}
        >
          <div />

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-white/70" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm pl-8 pr-3 py-1.5 text-sm w-full max-w-[120px] sm:max-w-[180px] md:max-w-[240px] md:pl-10 md:pr-4 md:py-2 md:text-base text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/70 border border-gray-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportCalendar}
              className="text-gray-700 dark:text-white hover:bg-white/10"
              title="Export Calendar"
            >
              <Download className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-700 dark:text-white hover:bg-white/10"
            >
              <Settings className="h-6 w-6 drop-shadow-md" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
              U
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="relative flex-1 w-full pt-4 flex overflow-auto h-full">
        {/* Sidebar Overlay per mobile */}
        {isMobile && !sidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-black/40 flex"
            onClick={() => setSidebarCollapsed(true)}
          >
            <div
              className="relative h-full"
              style={{ width: 256 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                isLoaded={isLoaded}
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
                onAddEvent={handleAddEvent}
                onAddEventWithAI={handleAddEventWithAI}
                onConnectionsOpen={() => setIsConnectionsOpen(true)}
                collapsed={false}
              />
            </div>
          </div>
        )}
        {/* Sidebar desktop */}
        {!isMobile && (
          <div
            className={`transition-all duration-300 h-full ${
              sidebarCollapsed ? "hidden" : "block"
            } md:block`}
          >
            <Sidebar
              isLoaded={isLoaded}
              currentDate={currentDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              onAddEvent={handleAddEvent}
              onAddEventWithAI={handleAddEventWithAI}
              onConnectionsOpen={() => setIsConnectionsOpen(true)}
              collapsed={sidebarCollapsed}
            />
          </div>
        )}

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 h-[calc(100vh-80px)] overflow-hidden ${
            isLoaded ? "animate-fade-in" : ""
          } px-1 sm:px-2 md:px-4 lg:px-8`}
          style={{ animationDelay: "0.6s" }}
        >
          <CalendarView
            events={events}
            onEventAdd={handleEventAdd}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            searchQuery={searchQuery}
            currentDate={currentDate}
            onDateChange={handleMainCalendarDateChange}
            initialView={currentView}
          />
        </div>
        {/* Pulsante azione fluttuante in basso a destra */}
        <div className="fixed bottom-8 right-8 z-50">
          <AnimatedActionButton
            onAddEventAction={handleAddEvent}
            onAddEventWithAIAction={handleAddEventWithAI}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onCloseAction={() => setIsSettingsOpen(false)}
        currentView={currentView === "agenda" ? "month" : currentView}
        onViewChangeAction={handleViewChange}
      />

      {/* Connections Modal */}
      <ConnectionsModal
        isOpen={isConnectionsOpen}
        onCloseAction={() => setIsConnectionsOpen(false)}
      />

      {/* Regular Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onCloseAction={() => setIsEventModalOpen(false)}
        onSaveAction={handleEventAdd}
        event={editingEvent ?? undefined}
        mode={editingEvent && editingEvent.id ? "edit" : "create"}
      />

      {/* AI Event Modal */}
      <AIEventModal
        isOpen={isAIEventModalOpen}
        onCloseAction={() => setIsAIEventModalOpen(false)}
        onSaveAction={handleEventAdd}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
