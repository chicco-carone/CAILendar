import axios, { AxiosInstance } from "axios";
import {
  CalendarEvent,
  EnhancedAIResponse,
  AIErrorResponse,
  AIResponseMetadata,
} from "@/utils/types";

let baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:3000/api`;
console.log("API Base URL:", baseURL);

const API: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Converts text into calendar events
 * @param text Text containing event information
 * @param language Text language (default: 'it')
 * @returns Promise with array of calendar events
 */
export const textToCalendarEvents = async (
  text: string,
  language: string = "it",
): Promise<CalendarEvent[]> => {
  try {
    const response = await API.post<CalendarEvent[]>("/calendar/text", {
      text,
      language,
    });
    // Convert string dates to Date objects
    return response.data.map((event) => ({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    }));
  } catch (error) {
    console.error("Error converting text to events:", error);
    throw error;
  }
};

/**
 * Converts images into calendar events
 * @param images Array of image URLs or base64 strings
 * @param text Optional context text
 * @param language Preferred language (default: 'it')
 * @returns Promise with array of calendar events
 */
export const imageToCalendarEvents = async (
  images: string[],
  text: string = "",
  language: string = "it",
): Promise<CalendarEvent[]> => {
  try {
    const response = await API.post<CalendarEvent[]>("/calendar/file", {
      images,
      text,
      language,
    });
    return response.data;
  } catch (error) {
    console.error("Error converting files to events:", error);
    throw error;
  }
};

/**
 * Converts text and/or images into calendar events using AI (Enhanced Version)
 * @param text Optional text containing event information
 * @param image Optional image as base64 string or data URL
 * @param language Preferred language (default: 'it')
 * @param includeContext Whether to include calendar context for conflict detection (default: true)
 * @returns Promise with enhanced AI response containing events and metadata
 */
export const aiToCalendarEventsEnhanced = async (
  text?: string,
  image?: string,
  language: string = "it",
  includeContext: boolean = true,
): Promise<{
  events: CalendarEvent[];
  metadata: AIResponseMetadata;
}> => {
  try {
    console.log("aiToCalendarEventsEnhanced called with:", {
      hasText: !!text,
      hasImage: !!image,
      language,
      includeContext,
      textLength: text?.length,
      imageSize: image?.length,
    });

    if (!text && !image) {
      console.error("Validation error: No text or image provided");
      throw new Error("Deve essere fornito almeno del testo o un'immagine");
    }

    console.log("Making enhanced API request to /calendar/ai");
    const response = await API.post<EnhancedAIResponse>("/calendar/ai", {
      text,
      image,
      language,
      includeContext,
    }, {
      timeout: 30000, // 30 seconds timeout for AI requests
    });

    console.log("Enhanced API Response received:", {
      status: response.status,
      statusText: response.statusText,
      eventsCount: response.data?.events?.length,
      metadata: response.data?.metadata,
    });

    // Convert string dates to Date objects
    const events = response.data.events.map((event) => ({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    }));

    return {
      events,
      metadata: response.data.metadata,
    };
  } catch (error: any) {
    console.error("Error in aiToCalendarEventsEnhanced:", {
      error,
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });

    // Handle enhanced error responses
    if (error?.response?.data?.error) {
      const enhancedError = error.response.data as AIErrorResponse;
      const customError = new Error(enhancedError.error.message);
      (customError as any).code = enhancedError.error.code;
      (customError as any).retryable = enhancedError.error.retryable;
      (customError as any).requestId = enhancedError.error.requestId;
      throw customError;
    }

    throw error;
  }
};

/**
 * Converts text and/or images into calendar events using AI (Legacy Version)
 * @param text Optional text containing event information
 * @param image Optional image as base64 string or data URL
 * @param language Preferred language (default: 'it')
 * @returns Promise with array of calendar events
 */
export const aiToCalendarEvents = async (
  text?: string,
  image?: string,
  language: string = "it",
): Promise<CalendarEvent[]> => {
  try {
    // Use the enhanced version but return only events for backward compatibility
    const result = await aiToCalendarEventsEnhanced(
      text,
      image,
      language,
      true,
    );

    // Log warnings and conflicts for debugging
    if (result.metadata.warnings.length > 0) {
      console.warn("AI Processing Warnings:", result.metadata.warnings);
    }

    if (result.metadata.conflicts.length > 0) {
      console.warn("Scheduling Conflicts Detected:", result.metadata.conflicts);
    }

    return result.events;
  } catch (error: any) {
    console.error("Error in aiToCalendarEvents:", {
      error,
      message: error?.message,
      code: (error as any).code,
      requestId: (error as any).requestId,
    });
    throw error;
  }
};

/**
 * Exports an event to iCal format
 * @param event Calendar event to export
 * @returns iCal format string of the event
 */
export const exportEventToIcal = async (
  event: CalendarEvent,
): Promise<string> => {
  try {
    const response = await API.post<string>(
      "/calendar/export",
      {
        event: {
          ...event,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
        },
      },
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error exporting event to iCal:", error);
    throw error;
  }
};

/**
 * Imports events from an iCal file
 * @param icalData String containing iCal data
 * @returns Promise with array of calendar events
 */
export const importEventsFromIcal = async (
  icalData: string,
): Promise<CalendarEvent[]> => {
  try {
    const response = await API.post<CalendarEvent[]>("/calendar/import", {
      icalData,
    });
    return response.data;
  } catch (error) {
    console.error("Error importing events from iCal:", error);
    throw error;
  }
};

export default API;
