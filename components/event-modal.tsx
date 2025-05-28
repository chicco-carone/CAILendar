"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  X,
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlignLeft,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useTimezone } from "@/hooks/use-timezone";
import type { CalendarEvent, EventModalProps } from "@/utils/types";
import { BiSolidCalendarPlus } from "react-icons/bi";
import { BiCalendarCheck } from "react-icons/bi";

export function EventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
  onDelete,
  onModify,
  event,
  mode = "create",
  onPrev,
  onNext,
  canPrev,
  canNext,
  eventIndex,
  eventCount,
}: EventModalProps) {
  const { browserTimezone, allTimezones } = useTimezone();
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now);
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState("");
  const [calendar, setCalendar] = useState("My Calendar");
  const [timezone, setTimezone] = useState(browserTimezone || "Europe/Rome");
  const [isAllDay, setIsAllDay] = useState(false);

  const createSafeDate = (date: Date | string | undefined): Date => {
    if (!date) return new Date();
    const newDate = date instanceof Date ? date : new Date(date);
    return isNaN(newDate.getTime()) ? new Date() : newDate;
  };

  useEffect(() => {
    if (mode === "edit" && event) {
      setTitle(event.title || "");
      setLocation(event.location || "");
      setDescription(event.description || "");

      if (event.startDate) {
        setStartDate(createSafeDate(event.startDate));
      }
      if (event.endDate) {
        setEndDate(createSafeDate(event.endDate));
      }
      if (event.timezone) {
        setTimezone(event.timezone);
      }

      const calendarEntry = calendarOptions.find(
        (cal) => cal.color === event.color,
      );
      if (calendarEntry) {
        setCalendar(calendarEntry.name);
      }

      if (event.attendees && Array.isArray(event.attendees)) {
        setAttendees(event.attendees.join(", "));
      }
    }
  }, [mode, event]);

  const calendarOptions = [
    { name: "My Calendar", color: "bg-blue-500" },
    { name: "Work", color: "bg-green-500" },
    { name: "Personal", color: "bg-purple-500" },
    { name: "Family", color: "bg-orange-500" },
  ];

  const colorMap: { [key: string]: string } = {
    "My Calendar": "bg-blue-500",
    Work: "bg-green-500",
    Personal: "bg-purple-500",
    Family: "bg-orange-500",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate || !endDate) return;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid dates provided");
      return;
    }

    if (endDate < startDate) {
      console.error("End date must be after start date");
      return;
    }

    const eventData: CalendarEvent = {
      id:
        mode === "edit" && event && event.id
          ? event.id
          : Math.floor(Math.random() * 1000),
      title,
      startDate,
      endDate,
      timezone,
      color: colorMap[calendar],
      description,
      location,
      attendees: attendees
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a),
      organizer: mode === "edit" && event?.organizer ? event.organizer : "You",
    };

    if (onModify && mode === "edit") {
      onModify(eventData);
    }
    onSaveAction(eventData);
    onCloseAction();

    if (mode === "create") {
      setTitle("");
      setLocation("");
      setDescription("");
      setAttendees("");
      const now = new Date();
      setStartDate(now);
      const endDate = new Date(now);
      endDate.setHours(endDate.getHours() + 1);
      setEndDate(endDate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseAction}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-white">
              {mode === "create" ? "Create Event" : "Edit Event"}
            </h2>
            {/* The Save button that was here has been removed */}
            <div className="w-10"></div>{" "}
            {/* Placeholder to keep title centered if needed, or remove if not */}
          </div>
          {/* Barra di navigazione eventi multipli */}
          {typeof eventIndex === "number" &&
            typeof eventCount === "number" &&
            eventCount > 1 && (
              <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 bg-black/10">
                <Button
                  onClick={onPrev}
                  disabled={!canPrev}
                  className="bg-white/10 text-white flex items-center justify-center"
                  aria-label="Evento precedente"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </Button>
                <span className="text-white/70 text-sm">
                  Evento {eventIndex + 1} di {eventCount}
                </span>
                <Button
                  onClick={onNext}
                  disabled={!canNext}
                  className="bg-white/10 text-white flex items-center justify-center"
                  aria-label="Evento successivo"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Button>
              </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div>
            <Input
              placeholder="Italiano e Storia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-transparent border-b border-white/30 text-white placeholder:text-white/70 text-2xl focus:ring-0 focus:border-pink-500 py-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-white/70" />
              <span className="text-white text-sm">Tutto il giorno</span>
            </div>
            <label
              htmlFor="all-day-switch"
              className="flex items-center cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="all-day-switch"
                  className="sr-only"
                  checked={isAllDay}
                  onChange={() => setIsAllDay(!isAllDay)}
                />
                <div
                  className={`block w-10 h-6 rounded-full ${isAllDay ? "bg-pink-500" : "bg-gray-600"}`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAllDay ? "translate-x-full" : ""}`}
                ></div>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <BiSolidCalendarPlus className="h-5 w-5 text-white/70 " />
            <div className="flex w-full gap-2">
              <div className={isAllDay ? "w-full" : "w-[70%]"}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal text-white hover:bg-white/20 bg-white/10 border border-white/20 px-3 py-2 h-10"
                    >
                      {startDate && !isNaN(startDate.getTime())
                        ? format(startDate, "EEE d MMM yyyy")
                        : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date);
                          newDate.setHours(startDate.getHours());
                          newDate.setMinutes(startDate.getMinutes());
                          setStartDate(newDate);
                          if (endDate < newDate) {
                            const newEndDate = new Date(newDate);
                            newEndDate.setHours(endDate.getHours());
                            newEndDate.setMinutes(endDate.getMinutes());
                            setEndDate(newEndDate);
                          }
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {!isAllDay && (
                <div className="w-[30%]">
                  <Select
                    value={
                      startDate && !isNaN(startDate.getTime())
                        ? format(startDate, "HH:mm")
                        : "08:50"
                    }
                    onValueChange={(value) => {
                      const [hours, minutes] = value.split(":").map(Number);
                      const newDate = new Date(startDate);
                      if (!isNaN(newDate.getTime())) {
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        setStartDate(newDate);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border border-white/20 text-white w-full px-3 py-2 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 * 4 }, (_, i) => {
                        const totalMinutes = i * 15;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                        return (
                          <SelectItem key={timeString} value={timeString}>
                            {timeString}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BiCalendarCheck className="h-5 w-5 text-white/70" />
            <div className="flex w-full gap-2">
              <div className={isAllDay ? "w-full" : "w-[70%]"}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal text-white hover:bg-white/20 bg-white/10 border border-white/20 px-3 py-2 h-10"
                    >
                      {endDate && !isNaN(endDate.getTime())
                        ? format(endDate, "EEE d MMM yyyy")
                        : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date);
                          newDate.setHours(endDate.getHours());
                          newDate.setMinutes(endDate.getMinutes());
                          if (newDate >= startDate) {
                            setEndDate(newDate);
                          } else {
                            const adjustedDate = new Date(startDate);
                            adjustedDate.setHours(endDate.getHours());
                            adjustedDate.setMinutes(endDate.getMinutes());
                            setEndDate(adjustedDate);
                          }
                        }
                      }}
                      initialFocus
                      disabled={(date) => {
                        const startDateOnly = new Date(startDate);
                        startDateOnly.setHours(0, 0, 0, 0);
                        return date < startDateOnly;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {!isAllDay && (
                <div className="w-[30%]">
                  <Select
                    value={
                      endDate && !isNaN(endDate.getTime())
                        ? format(endDate, "HH:mm")
                        : "09:45"
                    }
                    onValueChange={(value) => {
                      const [hours, minutes] = value.split(":").map(Number);
                      const newDate = new Date(endDate);
                      if (!isNaN(newDate.getTime())) {
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        setEndDate(newDate);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border border-white/20 text-white w-full px-3 py-2 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 * 4 }, (_, i) => {
                        const totalMinutes = i * 15;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                        return (
                          <SelectItem key={timeString} value={timeString}>
                            {timeString}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-white/70" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-white/10 border border-white/20 text-white w-full px-3 py-2 h-auto focus:ring-pink-500">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {allTimezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
                \
              </SelectContent>
            </Select>
          </div>

          {/* TODO: Add recurrence options like in the screenshot */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-white/70" />
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 bg-white/10 border border-white/20 px-3 py-2 h-auto justify-start w-full"
            >
              Aggiungi persone
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-white/70" />
            <Input
              placeholder="Aggiungi posizione"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/70 focus:ring-pink-500 px-3 py-2 h-auto"
            />
          </div>

          <div className="flex items-center gap-3">
            <AlignLeft className="h-5 w-5 text-white/70" />
            <Textarea
              placeholder="Aggiungi descrizione"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/70 min-h-[80px] focus:ring-pink-500 px-3 py-2"
            />
          </div>

          {/* TODO: Add visibility and availability options */}

          <div className="flex justify-end gap-2 pt-4">
            {onDelete && mode === "edit" && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            )}
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {mode === "create" ? "Save" : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
