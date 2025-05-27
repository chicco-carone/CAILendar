"use client";

import type React from "react";

import { useState } from "react";
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
import type { CreateEventModalProps } from "@/utils/types";

export function CreateEventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
}: CreateEventModalProps) {
  const { browserTimezone, allTimezones } = useTimezone();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState("");
  const [calendar, setCalendar] = useState("My Calendar");
  const [timezone, setTimezone] = useState(browserTimezone || "Europe/Rome");

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

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      timeOptions.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date) return;

    const dayOfWeek = date.getDay() + 1;

    const newEvent = {
      id: Math.floor(Math.random() * 1000),
      title,
      startTime,
      endTime,
      timezone,
      color: colorMap[calendar],
      day: dayOfWeek,
      description,
      location,
      attendees: attendees
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a),
      organizer: "You",
      date: date ? format(date, "MMMM d") : "",
    };

    onSaveAction(newEvent);
    onCloseAction();

    setTitle("");
    setLocation("");
    setDescription("");
    setAttendees("");
    setStartTime("09:00");
    setEndTime("10:00");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Create Event</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseAction}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Input
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-white/70" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white"
                >
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-white/70" />
            <div className="grid grid-cols-2 gap-2 w-full">
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-white/70" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {allTimezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white/70" />
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-white/70" />
            <Input
              placeholder="Add attendees (comma separated)"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <AlignLeft className="h-5 w-5 text-white/70" />
            <Textarea
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70 min-h-[80px]"
            />
          </div>

          <div>
            <Select value={calendar} onValueChange={setCalendar}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendarOptions.map((cal) => (
                  <SelectItem key={cal.name} value={cal.name}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                      <span>{cal.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseAction}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
