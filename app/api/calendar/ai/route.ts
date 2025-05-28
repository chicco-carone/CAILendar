import { z } from "zod";
import {
  type CalendarEvent,
  type MessageContent,
  type RawEventFromAI,
  type SerializedCalendarEvent,
  type AIModel,
  type APIError,
} from "@/utils/types";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { v4 as uuidv4 } from "uuid";
import { CALENDAR_IMAGE_PROMPT, CALENDAR_TEXT_PROMPT } from "@/lib/prompts";
import { parseISO, isValid, addHours, addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { validateAndNormalizeRequest } from "@/utils/validation-schemas";
import {
  AIError,
  mapZodError,
  createAIError,
  createCalendarError,
} from "@/utils/ai-errors";
import { CalendarContextReader } from "@/utils/calendar-context";
import { getStoredEvents } from "@/utils/calendar-storage";
import { aiResponseParser } from "@/utils/ai-response-parser";
import {
  detectConflicts,
  type DetailedConflict,
} from "@/utils/conflict-detector";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function serializeCalendarEvents(
  events: CalendarEvent[],
): SerializedCalendarEvent[] {
  return events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  }));
}

export async function POST(req: Request) {
  const requestId = uuidv4().slice(0, 8);
  console.log(`[AI-${requestId}] Processing AI calendar request`);

  try {
    const rawRequest = await req.json();
    console.log(`[AI-${requestId}] Raw request:`, {
      hasImage: !!rawRequest.image,
      imageLength: rawRequest.image?.length,
      hasText: !!rawRequest.text,
      textLength: rawRequest.text?.length,
      language: rawRequest.language,
    });

    let validatedRequest;
    try {
      validatedRequest = validateAndNormalizeRequest(rawRequest);
    } catch (validationError) {
      const aiError = mapZodError(validationError);
      console.error(`[AI-${requestId}] Validation failed:`, aiError.message);
      return new Response(JSON.stringify(aiError.toJSON()), {
        status: aiError.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    let calendarContext = "";
    let existingEvents: CalendarEvent[] = [];

    if (validatedRequest.includeContext) {
      try {
        existingEvents = getStoredEvents();
        const contextReader = new CalendarContextReader(() => existingEvents);
        contextReader.updateEvents(existingEvents);

        const contextOptions = {
          startDate: new Date(),
          endDate: addDays(new Date(), 30),
          timezone: validatedRequest.timezone,
        };

        calendarContext = contextReader.formatEventsForAI(contextOptions);
        console.log(
          `[AI-${requestId}] Calendar context: ${existingEvents.length} events`,
        );
      } catch (contextError) {
        console.warn(
          `[AI-${requestId}] Calendar context failed:`,
          contextError,
        );
        calendarContext = "Calendar context temporarily unavailable.";
      }
    } else {
      calendarContext = "Calendar context disabled for this request.";
    }

    const now = new Date();
    const formattedNow = formatDate(now);

    let prompt: string;
    if (validatedRequest.image) {
      prompt = CALENDAR_IMAGE_PROMPT.replace("{formattedNow}", formattedNow)
        .replace("{timezone}", validatedRequest.timezone)
        .replace("{language}", validatedRequest.language)
        .replace("{calendarContext}", calendarContext);
    } else {
      prompt = CALENDAR_TEXT_PROMPT.replace("{formattedNow}", formattedNow)
        .replace("{timezone}", validatedRequest.timezone)
        .replace("{language}", validatedRequest.language)
        .replace("{calendarContext}", calendarContext);
    }

    console.log(`[AI-${requestId}] AI prompt prepared with context`);

    let aiResponse: string;
    try {
      if (validatedRequest.image) {
        const content: MessageContent[] = [
          { type: "text", text: prompt },
          {
            type: "image",
            image: validatedRequest.image,
          },
        ];

        if (validatedRequest.text) {
          content.push({
            type: "text",
            text: `Additional context: ${validatedRequest.text}`,
          });
        }

        const result = await generateText({
          model: google("models/gemini-2.0-flash-exp"),
          messages: [{ role: "user", content }],
          maxTokens: 16384,
          temperature: 0.7,
          topP: 0.9,
        });
        aiResponse = result.text;
      } else {
        const result = await generateText({
          model: google("models/gemini-2.0-flash-exp"),
          prompt: `${prompt}\n\nUser input: ${validatedRequest.text}`,
          maxTokens: 32768,
          temperature: 0.7,
          topP: 0.9,
        });
        aiResponse = result.text;
      }
    } catch (aiError) {
      console.error(`[AI-${requestId}] AI generation failed:`, aiError);
      throw createAIError(aiError);
    }

    console.log(
      `[AI-${requestId}] AI response received (${aiResponse.length} chars)`,
    );

    let parsedResponse;
    try {
      parsedResponse = aiResponseParser.parseAIResponse(aiResponse);
      console.log(
        `[AI-${requestId}] Parsed ${parsedResponse.events.length} events using ${parsedResponse.parsingMethod}`,
      );

      if (parsedResponse.warnings.length > 0) {
        console.warn(
          `[AI-${requestId}] Parsing warnings:`,
          parsedResponse.warnings,
        );
      }

      // Log additional debug info for JSON parsing issues
      if (parsedResponse.parsingMethod !== 'json') {
        console.warn(
          `[AI-${requestId}] JSON parsing failed, response preview:`,
          aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : '')
        );
        console.warn(
          `[AI-${requestId}] Response length: ${aiResponse.length} chars, ends with:`,
          aiResponse.substring(Math.max(0, aiResponse.length - 100))
        );
      }

      // Log detailed parsing information
      console.log(
        `[AI-${requestId}] Parsing details:`,
        {
          method: parsedResponse.parsingMethod,
          eventsCount: parsedResponse.events.length,
          warnings: parsedResponse.warnings,
          responseLength: aiResponse.length,
          responseStart: aiResponse.substring(0, 100),
          responseEnd: aiResponse.substring(Math.max(0, aiResponse.length - 100))
        }
      );

      // Log the complete AI response for debugging
      console.log(
        `[AI-${requestId}] Complete AI response:`,
        aiResponse
      );

      // Log the parsed events in JSON format
      console.log(
        `[AI-${requestId}] Generated events JSON:`,
        JSON.stringify(parsedResponse.events, null, 2)
      );

      // Log each individual event for easy reading
      parsedResponse.events.forEach((event, index) => {
        console.log(
          `[AI-${requestId}] Event ${index + 1}:`,
          {
            title: event.title,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            location: event.location,
            timezone: event.timezone,
            description: event.description
          }
        );
      });
    } catch (parseError) {
      console.error(`[AI-${requestId}] Parsing failed:`, parseError);
      console.error(
        `[AI-${requestId}] Failed response preview:`,
        aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '...' : '')
      );
      throw createAIError(parseError);
    }

    let conflicts: DetailedConflict[] = [];
    let conflictWarnings: string[] = [];

    if (existingEvents.length > 0 && parsedResponse.events.length > 0) {
      try {
        conflicts = detectConflicts(parsedResponse.events, existingEvents);

        if (conflicts.length > 0) {
          conflictWarnings = conflicts.map(
            (conflict) =>
              `Event "${conflict.newEvent.title}" conflicts with ${conflict.conflictingEvents.length} existing event(s). ${conflict.suggestion}`,
          );
          console.log(
            `[AI-${requestId}] Detected ${conflicts.length} scheduling conflicts`,
          );
        }
      } catch (conflictError) {
        console.warn(
          `[AI-${requestId}] Conflict detection failed:`,
          conflictError,
        );
      }
    }

    const serializedEvents = serializeCalendarEvents(parsedResponse.events);
    const responseData = {
      events: serializedEvents,
      metadata: {
        requestId,
        parsingMethod: parsedResponse.parsingMethod,
        warnings: [...parsedResponse.warnings, ...conflictWarnings],
        conflicts: conflicts.map((conflict) => ({
          eventTitle: conflict.newEvent.title,
          conflictCount: conflict.conflictingEvents.length,
          severity: conflict.severity,
          suggestion: conflict.suggestion,
        })),
        calendarContext: {
          existingEvents: existingEvents.length,
          contextIncluded: validatedRequest.includeContext,
        },
        processingTime: Date.now(),
      },
    };

    console.log(`[AI-${requestId}] Request completed successfully`);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  } catch (error: unknown) {
    console.error(`[AI-${requestId}] Request failed:`, error);

    if (error instanceof AIError) {
      return new Response(JSON.stringify(error.toJSON()), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    }

    const fallbackError = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing your request.",
        retryable: true,
        requestId,
      },
    };

    return new Response(JSON.stringify(fallbackError), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  }
}
