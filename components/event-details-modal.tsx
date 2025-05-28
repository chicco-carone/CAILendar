import { Clock, Trash, MapPin, Users } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { useTimeFormat } from "@/hooks/use-time-format";
import type { EventDetailsModalProps } from "@/utils/types";

export function EventDetailsModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  const { formatTime } = useTimeFormat();
  
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className={`${event.color} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}
      >
        <h3 className="text-2xl font-bold mb-4 text-white">{event.title}</h3>
        <div className="space-y-3 text-white">
          <p className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            {`${formatTime(formatInTimeZone(event.startDate, event.timezone, "HH:mm"))} - ${formatTime(formatInTimeZone(event.endDate, event.timezone, "HH:mm"))}`}
          </p>
          {event.location && (
            <p className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              {event.location}
            </p>
          )}
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-5 w-5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {formatInTimeZone(
              event.startDate,
              event.timezone,
              "EEEE, MMMM d, yyyy",
            )}
          </p>
          {event.attendees && event.attendees.length > 0 && (
            <p className="flex items-start">
              <Users className="mr-2 h-5 w-5 mt-1" />
              <span>
                <strong>Attendees:</strong>
                <br />
                {event.attendees.join(", ")}
              </span>
            </p>
          )}
          {event.organizer && (
            <p>
              <strong>Organizer:</strong> {event.organizer}
            </p>
          )}
          {event.description && (
            <p>
              <strong>Description:</strong> {event.description}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            onClick={() => {
              onClose();
              onDelete(event);
            }}
          >
            <Trash className="h-4 w-4 mr-1 inline-block" />
            Delete
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            onClick={() => {
              onClose();
              onEdit(event);
            }}
          >
            Edit
          </button>
          <button
            className="bg-white text-gray-800 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
