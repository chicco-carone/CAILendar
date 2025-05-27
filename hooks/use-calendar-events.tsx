import { useState } from "react";
import type { CalendarEvent } from "@/utils/types";

interface UseCalendarEventsProps {
  onEventAdd?: (event: Partial<CalendarEvent>) => void;
  onEventUpdate?: (event: Partial<CalendarEvent>) => void;
  onEventDelete?: (eventId: number | string) => void;
}

export function useCalendarEvents({
  onEventAdd,
  onEventUpdate,
  onEventDelete,
}: UseCalendarEventsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null,
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete && onEventDelete) {
      onEventDelete(eventToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    if (eventData.id) {
      if (onEventUpdate) onEventUpdate(eventData);
    } else {
      if (onEventAdd) onEventAdd(eventData);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editingEvent,
    setEditingEvent,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    eventToDelete,
    setEventToDelete,
    selectedEvent,
    setSelectedEvent,
    handleEditEvent,
    handleDeleteEvent,
    confirmDeleteEvent,
    handleSaveEvent,
  };
}
