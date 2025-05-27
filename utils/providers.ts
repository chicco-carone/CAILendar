import { SiGooglecalendar } from "react-icons/si";
import { FaApple, FaCalendar } from "react-icons/fa";
import { PiMicrosoftOutlookLogo } from "react-icons/pi";

const providers = [
  {
    id: "google",
    name: "Google Calendar",
    icon: SiGooglecalendar,
    description: "Sync with your Google Calendar account",
    color: "bg-blue-500",
  },
  {
    id: "apple",
    name: "Apple Calendar",
    icon: FaApple,
    description: "Sync with your Apple Calendar account",
    color: "bg-red-500",
  },
  {
    id: "outlook",
    name: "Outlook Calendar",
    icon: PiMicrosoftOutlookLogo,
    description: "Sync with your Microsoft Outlook account",
    color: "bg-blue-600",
  },
  {
    id: "caldav",
    name: "CalDAV",
    icon: FaCalendar,
    description: "Connect to any CalDAV compatible calendar",
    color: "bg-purple-500",
  },
];

export default providers;
