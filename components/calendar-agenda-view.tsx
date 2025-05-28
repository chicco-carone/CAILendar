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
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {sortedEvents.map((event, index) => (
            <div
              key={index}
              className={`group relative p-3 rounded-lg shadow-sm border border-white/10 cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-1px] hover:shadow-lg hover:border-white/20 ${
                event.color
              } ${
                searchQuery &&
                (event.title
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                  (event.description &&
                    event.description
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())) ||
                  (event.location &&
                    event.location
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())) ||
                  (event.attendees &&
                    event.attendees.some((attendee) =>
                      attendee
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    )))
                  ? "ring-2 ring-white/50"
                  : ""
              }`}
              onClick={() => handleEventClick(event)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-white/90 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-white/80 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                      {formatInTimezone(
                        fromUTC(event.startDate, event.timezone),
                        event.timezone,
                        "EEEE, MMM d",
                      )}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1 text-sm text-white/90">
                        📍 <span className="truncate">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-medium text-white/90 bg-black/20 px-2 py-0.5 rounded-full">
                    {`${formatInTimezone(fromUTC(event.startDate, event.timezone), event.timezone, "HH:mm")} - ${formatInTimezone(fromUTC(event.endDate, event.timezone), event.timezone, "HH:mm")}`}
                  </div>
                </div>
              </div>

              {/* Event details */}
              <div className="space-y-1">
                {event.description && (
                  <div className="text-sm text-white/80 leading-relaxed line-clamp-1 bg-black/10 px-2 py-1 rounded">
                    {event.description}
                  </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-white/90">
                    <div className="w-3 h-3 flex items-center justify-center">
                      👥
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {event.attendees.slice(0, 2).map((attendee, idx) => (
                        <span
                          key={idx}
                          className="bg-black/20 px-1.5 py-0.5 rounded text-xs"
                        >
                          {attendee}
                        </span>
                      ))}
                      {event.attendees.length > 2 && (
                        <span className="bg-black/20 px-1.5 py-0.5 rounded text-xs">
                          +{event.attendees.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hover indicator */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
