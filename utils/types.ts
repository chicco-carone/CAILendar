export interface CalendarEvent {
  id: number | string;
  title: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  color: string;
  description?: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
}

export interface TimezoneAwareDate {
  date: Date;
  timezone: string;
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  onEventAdd?: (event: Partial<CalendarEvent>) => void;
  onEventUpdate?: (event: Partial<CalendarEvent>) => void;
  onEventDelete?: (eventId: number | string) => void;
  searchQuery?: string;
  currentDate?: Date;
  onDateChange?: (
    date: Date,
    view: "day" | "week" | "month" | "agenda",
  ) => void;
  initialView?: "day" | "week" | "month" | "agenda";
}

export interface DayViewProps {
  currentDate: Date;
  timeSlots: number[];
  filteredEvents: CalendarEvent[];
  searchQuery: string;
  handleTimeSlotClick: (day: number, hour: number) => void;
  handleEventClick: (event: CalendarEvent) => void;
  calculateEventStyle: (
    startDate: Date,
    endDate: Date,
  ) => { top: string; height: string };
  formatTime: (time: string) => string;
  formatHour: (hour: number) => string;
}

export interface WeekViewProps {
  weekDays: Date[];
  timeSlots: number[];
  filteredEvents: CalendarEvent[];
  searchQuery: string;
  handleTimeSlotClick: (day: number, hour: number) => void;
  handleEventClick: (event: CalendarEvent) => void;
  calculateEventStyle: (
    startDate: Date,
    endDate: Date,
  ) => { top: string; height: string };
  formatTime: (time: string) => string;
  formatHour: (hour: number) => string;
}

export interface MonthViewProps {
  currentDate: Date;
  filteredEvents: CalendarEvent[];
  searchQuery: string;
  handleDateClick: (date: Date) => void;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface AgendaViewProps {
  currentDate: Date;
  filteredEvents: CalendarEvent[];
  searchQuery: string;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface CreateEventModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (eventData: Partial<CalendarEvent>) => void;
}

export interface EventModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (eventData: Partial<CalendarEvent>) => void;
  onDelete?: () => void;
  onModify?: (eventData: Partial<CalendarEvent>) => void;
  event?: Partial<CalendarEvent>;
  mode: "create" | "edit";
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  eventIndex?: number;
  eventCount?: number;
}

export interface EventDetailsModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export interface AIEventModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (eventData: Partial<CalendarEvent>) => void;
}

export interface ConnectionsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: "day" | "week" | "month";
  onViewChange: (view: "day" | "week" | "month") => void;
}

export interface ActionButtonProps {
  onAddEvent: () => void;
  onAddEventWithAI: () => void;
  className?: string;
  collapsed?: boolean;
}

export interface SidebarProps {
  isLoaded: boolean;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onAddEvent: () => void;
  onAddEventWithAI: () => void;
  onConnectionsOpen: () => void;
  collapsed?: boolean;
}

export interface MiniCalendarProps {
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  currentDate?: Date;
}

// Tipi per il contenuto multimodale dell'AI
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  image: string;
}

export type MessageContent = TextContent | ImageContent;

// Tipi per eventi raw dall'AI (prima della validazione)
export interface RawEventFromAI {
  title?: string;
  start?: string;
  end?: string;
  timezone?: string;
  location?: string | null;
  description?: string;
  [key: string]: unknown;
}

// Tipo per la risposta serializzata JSON
export interface SerializedCalendarEvent {
  id: string | number;
  title: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  timezone: string;
  color: string;
  description?: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
}

// Tipo per il modello AI
export interface AIModel {
  [key: string]: unknown;
}

// Tipo per gestire errori tipizzati
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}
