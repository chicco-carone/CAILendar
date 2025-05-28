"use client";

import React from "react";
import { MapPin, AlignLeft, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Logger } from "@/utils/logger";

const logger = new Logger("EventFormFields", true);

interface EventFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  location: string;
  setLocation: (location: string) => void;
  description: string;
  setDescription: (description: string) => void;
  attendees: string;
  setAttendees: (attendees: string) => void;
  className?: string;
}

export function EventFormFields({
  title,
  setTitle,
  location,
  setLocation,
  description,
  setDescription,
  attendees,
  setAttendees,
  className = "",
}: EventFormFieldsProps) {
  logger.debug("EventFormFields render", {
    titleLength: title.length,
    locationLength: location.length,
    descriptionLength: description.length,
    attendeesLength: attendees.length,
  });

  const handleFieldChange = (
    field: string,
    value: string,
    setter: (value: string) => void,
  ) => {
    logger.debug("Form field changed", {
      field,
      valueLength: value.length,
      previousLength:
        field === "title"
          ? title.length
          : field === "location"
            ? location.length
            : field === "description"
              ? description.length
              : attendees.length,
    });
    setter(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title Field */}
      <div>
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => handleFieldChange("title", e.target.value, setTitle)}
          required
          className="bg-transparent border-b border-white/30 text-white placeholder:text-white/70 text-2xl focus:ring-0 focus:border-pink-500 py-2"
        />
      </div>

      {/* Attendees Field */}
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-white/70" />
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 bg-white/10 border border-white/20 px-3 py-2 h-auto justify-start w-full"
        >
          Add people
        </Button>
      </div>

      {/* Location Field */}
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-white/70" />
        <Input
          placeholder="Add location"
          value={location}
          onChange={(e) =>
            handleFieldChange("location", e.target.value, setLocation)
          }
          className="bg-white/10 border border-white/20 text-white placeholder:text-white/70 focus:ring-pink-500 px-3 py-2 h-auto"
        />
      </div>

      {/* Description Field */}
      <div className="flex items-center gap-3">
        <AlignLeft className="h-5 w-5 text-white/70" />
        <Textarea
          placeholder="Add description"
          value={description}
          onChange={(e) =>
            handleFieldChange("description", e.target.value, setDescription)
          }
          className="bg-white/10 border border-white/20 text-white placeholder:text-white/70 min-h-[80px] focus:ring-pink-500 px-3 py-2"
        />
      </div>
    </div>
  );
}
