import {
  AIEventsResponseSchema,
  AIEventValidationSchema,
} from "./validation-schemas";
import { createAIError, AIErrorCode, AIProcessingError } from "./ai-errors";
import type { CalendarEvent, RawEventFromAI } from "@/utils/types";
import { parseISO, isValid, addHours } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { v4 as uuidv4 } from "uuid";

export interface ParsedAIResponse {
  events: CalendarEvent[];
  rawResponse: string;
  parsingMethod: "json" | "structured" | "fallback";
  warnings: string[];
}

export interface AIResponseParserOptions {
  fallbackTimezone?: string;
  defaultDuration?: number; // in hours
  strictValidation?: boolean;
}

export class AIResponseParser {
  private options: Required<AIResponseParserOptions>;

  constructor(options: AIResponseParserOptions = {}) {
    this.options = {
      fallbackTimezone:
        options.fallbackTimezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultDuration: options.defaultDuration || 1,
      strictValidation: options.strictValidation || false,
    };
  }

  /**
   * Parse AI response with multiple fallback strategies
   */
  parseAIResponse(response: string): ParsedAIResponse {
    const warnings: string[] = [];
    let events: CalendarEvent[] = [];
    let parsingMethod: "json" | "structured" | "fallback" = "json";

    try {
      // Strategy 1: Direct JSON parsing
      const jsonResult = this.parseAsJSON(response);
      if (jsonResult.success) {
        events = jsonResult.events;
        parsingMethod = "json";
      } else {
        warnings.push(
          "Direct JSON parsing failed, trying structured extraction",
        );

        // Strategy 2: Extract JSON from mixed content
        const structuredResult = this.extractStructuredData(response);
        if (structuredResult.success) {
          events = structuredResult.events;
          parsingMethod = "structured";
        } else {
          warnings.push("Structured extraction failed, using fallback parsing");

          // Strategy 3: Fallback text parsing
          const fallbackResult = this.fallbackTextParsing(response);
          events = fallbackResult.events;
          parsingMethod = "fallback";
          warnings.push(...fallbackResult.warnings);
        }
      }

      // Validate and enhance events
      const validatedEvents = this.validateAndEnhanceEvents(events);
      warnings.push(...validatedEvents.warnings);

      return {
        events: validatedEvents.events,
        rawResponse: response,
        parsingMethod,
        warnings,
      };
    } catch (error) {
      throw createAIError(error);
    }
  }

  /**
   * Parse response as direct JSON with enhanced error recovery
   */
  private parseAsJSON(response: string): {
    success: boolean;
    events: CalendarEvent[];
  } {
    try {
      // Clean the response
      let cleanedResponse = response.trim();

      // Remove common AI response prefixes/suffixes
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .replace(/^json\s*/i, "")
        .trim();

      // Enhanced JSON cleaning and repair
      cleanedResponse = this.repairJSON(cleanedResponse);

      // Validate response completeness
      if (!this.isCompleteJSON(cleanedResponse)) {
        console.warn("JSON appears to be truncated or incomplete");
        // Try to extract the largest valid JSON array
        cleanedResponse = this.extractLargestValidJSON(cleanedResponse);
      }

      // Try to parse as JSON
      const parsed = JSON.parse(cleanedResponse);

      // Handle different response formats
      let eventsRaw: RawEventFromAI[] = [];
      if (Array.isArray(parsed)) {
        eventsRaw = parsed;
      } else if (parsed && Array.isArray(parsed.events)) {
        eventsRaw = parsed.events;
      } else if (parsed && typeof parsed === "object") {
        // Single event object
        eventsRaw = [parsed];
      } else {
        return { success: false, events: [] };
      }

      // Validate the structure
      const validationResult = AIEventsResponseSchema.safeParse({
        events: eventsRaw,
      });
      if (!validationResult.success) {
        console.warn("JSON validation failed:", validationResult.error);
        return { success: false, events: [] };
      }

      const events = this.convertRawEvents(eventsRaw);
      return { success: true, events };
    } catch (error) {
      console.warn("JSON parsing failed:", error);
      return { success: false, events: [] };
    }
  }

  /**
   * Extract structured data from mixed content
   */
  private extractStructuredData(response: string): {
    success: boolean;
    events: CalendarEvent[];
  } {
    try {
      // Look for JSON-like structures in the response
      const jsonMatches = response.match(/\{[\s\S]*?\}|\[[\s\S]*?\]/g);

      if (!jsonMatches) {
        return { success: false, events: [] };
      }

      // Try each match
      for (const match of jsonMatches) {
        try {
          const result = this.parseAsJSON(match);
          if (result.success && result.events.length > 0) {
            return result;
          }
        } catch {
          // Continue to next match
        }
      }

      return { success: false, events: [] };
    } catch (error) {
      console.warn("Structured extraction failed:", error);
      return { success: false, events: [] };
    }
  }

  /**
   * Fallback text parsing when JSON parsing fails
   */
  private fallbackTextParsing(response: string): {
    events: CalendarEvent[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const events: CalendarEvent[] = [];

    try {
      // Split response into lines and look for event-like patterns
      const lines = response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      let currentEvent: Partial<RawEventFromAI> = {};

      for (const line of lines) {
        // Look for title patterns
        if (
          line.match(/title|event|meeting|appointment/i) &&
          line.includes(":")
        ) {
          const titleMatch = line.split(":")[1]?.trim();
          if (titleMatch) {
            if (Object.keys(currentEvent).length > 0) {
              // Save previous event
              const event = this.createEventFromPartial(currentEvent);
              if (event) events.push(event);
            }
            currentEvent = { title: titleMatch };
          }
        }

        // Look for date/time patterns
        if (line.match(/start|begin|from/i) && line.includes(":")) {
          const timeMatch = line.split(":").slice(1).join(":").trim();
          if (timeMatch) {
            currentEvent.start = timeMatch;
          }
        }

        if (line.match(/end|until|to/i) && line.includes(":")) {
          const timeMatch = line.split(":").slice(1).join(":").trim();
          if (timeMatch) {
            currentEvent.end = timeMatch;
          }
        }

        // Look for location patterns
        if (line.match(/location|place|where/i) && line.includes(":")) {
          const locationMatch = line.split(":")[1]?.trim();
          if (locationMatch) {
            currentEvent.location = locationMatch;
          }
        }
      }

      // Save last event
      if (Object.keys(currentEvent).length > 0) {
        const event = this.createEventFromPartial(currentEvent);
        if (event) events.push(event);
      }

      if (events.length === 0) {
        warnings.push("No events could be extracted from the AI response");
      } else {
        warnings.push(
          `Extracted ${events.length} events using fallback text parsing`,
        );
      }
    } catch (error) {
      warnings.push(
        "Fallback parsing failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }

    return { events, warnings };
  }

  /**
   * Create event from partial data
   */
  private createEventFromPartial(
    partial: Partial<RawEventFromAI>,
  ): CalendarEvent | null {
    if (!partial.title) {
      return null;
    }

    const now = new Date();
    const startDate = partial.start
      ? this.parseFlexibleDate(partial.start)
      : now;
    const endDate = partial.end
      ? this.parseFlexibleDate(partial.end)
      : addHours(startDate, this.options.defaultDuration);

    return {
      id: uuidv4(),
      title: partial.title,
      startDate,
      endDate,
      timezone: partial.timezone || this.options.fallbackTimezone,
      color: "bg-blue-500",
      description: partial.description || "",
      location: partial.location || "",
      attendees: [],
      organizer: "",
    };
  }

  /**
   * Parse flexible date formats
   */
  private parseFlexibleDate(dateStr: string): Date {
    try {
      // Try ISO format first
      const isoDate = parseISO(dateStr);
      if (isValid(isoDate)) {
        return isoDate;
      }

      // Try common date formats
      const formats = [
        /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/,
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/,
        /(\d{1,2}):(\d{2})/,
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (match.length === 6) {
            // Full date format
            return new Date(
              parseInt(match[1]),
              parseInt(match[2]) - 1,
              parseInt(match[3]),
              parseInt(match[4]),
              parseInt(match[5]),
            );
          } else if (match.length === 3) {
            // Time only - use today's date
            const today = new Date();
            return new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              parseInt(match[1]),
              parseInt(match[2]),
            );
          }
        }
      }

      // Fallback to current time
      return new Date();
    } catch {
      return new Date();
    }
  }

  /**
   * Convert raw events to CalendarEvent format
   */
  private convertRawEvents(rawEvents: RawEventFromAI[]): CalendarEvent[] {
    return rawEvents.map((raw) => {
      const startDate = this.parseEventDate(raw.start || "");
      const endDate = this.parseEventDate(raw.end || "");

      return {
        id: uuidv4(),
        title: raw.title || "Untitled Event",
        startDate,
        endDate:
          endDate > startDate
            ? endDate
            : addHours(startDate, this.options.defaultDuration),
        timezone: raw.timezone || this.options.fallbackTimezone,
        color: "bg-blue-500",
        description: raw.description || "",
        location: raw.location || "",
        attendees: [],
        organizer: "",
      };
    });
  }

  /**
   * Parse event date with timezone handling
   */
  private parseEventDate(dateStr: string): Date {
    try {
      const parsedDate = parseISO(dateStr);
      if (!isValid(parsedDate)) {
        return new Date();
      }
      return parsedDate;
    } catch {
      return new Date();
    }
  }

  /**
   * Repair common JSON syntax errors
   */
  private repairJSON(jsonStr: string): string {
    let repaired = jsonStr;

    // Fix unterminated strings by finding unmatched quotes
    const quotePositions: number[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      
      if (!inString && char === '"') {
        inString = true;
        quotePositions.push(i);
      } else if (inString && char === '"' && !escaped) {
        inString = false;
        quotePositions.push(i);
      }
      
      escaped = char === '\\' && !escaped;
    }

    // If we end with an unmatched quote, try to close it
    if (quotePositions.length % 2 !== 0) {
      // Find the last incomplete string and try to close it properly
      const lastQuotePos = quotePositions[quotePositions.length - 1];
      const remainingStr = repaired.substring(lastQuotePos + 1);
      
      // Look for a natural string ending (comma, brace, bracket)
      const endMatch = remainingStr.match(/[,\}\]]/); 
      if (endMatch && endMatch.index !== undefined) {
        const insertPos = lastQuotePos + 1 + endMatch.index;
        repaired = repaired.substring(0, insertPos) + '"' + repaired.substring(insertPos);
      } else {
        // Just add a quote at the end
        repaired += '"';
      }
    }

    // Fix common issues
    repaired = repaired
      // Remove trailing commas
      .replace(/,\s*([\}\]])/g, '$1')
      // Fix missing commas between objects/arrays
      .replace(/([\}\]])\s*([\{\[])/g, '$1,$2')
      // Fix missing commas between string values
      .replace(/"\s*"([^,\}\]:])/g, '","$1')
      // Remove any remaining markdown or extra text
      .replace(/^[^\[\{]*([\[\{])/, '$1')
      .replace(/([\]\}])[^\]\}]*$/, '$1');

    return repaired;
  }

  /**
   * Check if JSON string appears to be complete
   */
  private isCompleteJSON(jsonStr: string): boolean {
    const trimmed = jsonStr.trim();
    
    // Check basic structure
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
      return false;
    }

    // Count brackets and braces
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;

    for (const char of trimmed) {
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
        else if (char === '"') inString = true;
      } else {
        if (char === '"' && !escaped) inString = false;
      }
      escaped = char === '\\' && !escaped;
    }

    return braceCount === 0 && bracketCount === 0 && !inString;
  }

  /**
   * Extract the largest valid JSON array from a potentially malformed string
   */
  private extractLargestValidJSON(jsonStr: string): string {
    const trimmed = jsonStr.trim();
    
    // Try to find a valid JSON array by progressively truncating
    if (trimmed.startsWith('[')) {
      // Look for array elements and try to close at natural boundaries
      const elements: string[] = [];
      let depth = 0;
      let currentElement = '';
      let inString = false;
      let escaped = false;
      
      for (let i = 1; i < trimmed.length; i++) { // Skip first '['
        const char = trimmed[i];
        
        if (!inString) {
          if (char === '{' || char === '[') depth++;
          else if (char === '}' || char === ']') depth--;
          else if (char === '"') inString = true;
          else if (char === ',' && depth === 0) {
            // End of element
            if (currentElement.trim()) {
              elements.push(currentElement.trim());
            }
            currentElement = '';
            continue;
          }
        } else {
          if (char === '"' && !escaped) inString = false;
        }
        
        escaped = char === '\\' && !escaped;
        currentElement += char;
        
        // If we reach a complete element, save it and continue looking for more
        if (depth === 0 && !inString && char === '}') {
          elements.push(currentElement.trim());
          currentElement = '';
          // Continue processing to find more elements
        }
      }
      
      if (elements.length > 0) {
        return '[' + elements.join(',') + ']';
      }
    }
    
    // Fallback: try to extract any valid JSON objects
    const objectMatches = trimmed.match(/\{[^\{\}]*\}/g);
    if (objectMatches && objectMatches.length > 0) {
      return '[' + objectMatches.join(',') + ']';
    }
    
    return '[]'; // Return empty array as last resort
  }

  /**
   * Validate and enhance parsed events
   */
  private validateAndEnhanceEvents(events: CalendarEvent[]): {
    events: CalendarEvent[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const validatedEvents: CalendarEvent[] = [];

    for (const event of events) {
      try {
        // Basic validation
        if (!event.title.trim()) {
          warnings.push("Event with empty title was skipped");
          continue;
        }

        if (event.endDate <= event.startDate) {
          warnings.push(
            `Event "${event.title}" has invalid time range, adjusted end time`,
          );
          event.endDate = addHours(
            event.startDate,
            this.options.defaultDuration,
          );
        }

        // Enhance event
        const enhancedEvent = {
          ...event,
          title: event.title.trim(),
          description: event.description?.trim() || "",
          location: event.location?.trim() || "",
        };

        validatedEvents.push(enhancedEvent);
      } catch (error) {
        warnings.push(
          `Failed to validate event "${event.title}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return { events: validatedEvents, warnings };
  }
}

// Default parser instance
export const aiResponseParser = new AIResponseParser();

/**
 * Quick parse function for simple use cases
 */
export function parseAIResponse(
  response: string,
  options?: AIResponseParserOptions,
): ParsedAIResponse {
  const parser = new AIResponseParser(options);
  return parser.parseAIResponse(response);
}
