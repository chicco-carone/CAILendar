import type { AgendaViewProps } from "@/utils/types";
import { formatInTimezone, fromUTC } from "@/utils/date-utils";



export function CalendarAgendaView({
  currentDate,
  filteredEvents,
  searchQuery,
  handleEventClick,
}: AgendaViewProps) {
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = fromUTC(a.startDate, a.timezone);
    const dateB = fromUTC(b.startDate, b.timezone);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="flex-1 p-4">
      <div className="space-y-4">
        {sortedEvents.map((event, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-md ${
              event.color
            } ${
              searchQuery &&
              (event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.description &&
                  event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (event.location &&
                  event.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (event.attendees &&
                  event.attendees.some((attendee) =>
                    attendee.toLowerCase().includes(searchQuery.toLowerCase())
                  )))
                ? "ring-2 ring-white"
                : ""
            }`}
            onClick={() => handleEventClick(event)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                <div className="mt-1 text-sm text-white/90">
                  {formatInTimezone(fromUTC(event.startDate, event.timezone), event.timezone, "EEEE, MMMM d, yyyy")}
                </div>
                <div className="mt-1 text-sm text-white/90">
                  {`${formatInTimezone(fromUTC(event.startDate, event.timezone), event.timezone, "HH:mm")} - ${formatInTimezone(fromUTC(event.endDate, event.timezone), event.timezone, "HH:mm")}`}
                </div>
                {event.location && (
                  <div className="mt-1 text-sm text-white/90">
                    📍 {event.location}
                  </div>
                )}
                {event.description && (
                  <div className="mt-2 text-sm text-white/90 line-clamp-2">
                    {event.description}
                  </div>
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="mt-2 text-sm text-white/90">
                    👥 {event.attendees.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
