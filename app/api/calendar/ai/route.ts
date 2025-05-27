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
import { parseISO, isValid, addHours } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const AICalendarEvent = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string(),
  timezone: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
});

const AICalendarEvents = z.object({
  events: z.array(AICalendarEvent),
});

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
  events: CalendarEvent[]
): SerializedCalendarEvent[] {
  return events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  }));
}

export class CalendarAI {
  private model: AIModel;
  constructor(model: AIModel) {
    this.model = model;
  }

  async generateEvents({
    image,
    text,
    language = "it",
  }: {
    image?: string;
    text?: string;
    language?: string;
  }) {
    const now = new Date();
    const formattedNow = formatDate(now);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    console.log("[CalendarAI] image length:", image?.length);
    console.log("[CalendarAI] text:", text);
    console.log("[CalendarAI] language:", language);

    if (image) {
      const imagePrompt = CALENDAR_IMAGE_PROMPT.replace(
        "{formattedNow}",
        formattedNow
      )
        .replace("{timezone}", timezone)
        .replace("{language}", language);

      console.log("[CalendarAI] Usando prompt per immagini:", imagePrompt);

      const content: MessageContent[] = [{ type: "text", text: imagePrompt }];

      content.push({
        type: "image",
        image: image.startsWith("data:")
          ? image
          : `data:image/jpeg;base64,${image}`,
      });

      if (text) {
        content.push({ type: "text", text: `Testo aggiuntivo: ${text}` });
      }

      const result = await generateText({
        model: google("models/gemini-2.0-flash-exp"),
        messages: [
          {
            role: "user",
            content,
          },
        ],
        maxTokens: 2048,
        temperature: 1,
        topP: 0.9,
      });
      return { text: result.text };
    } else if (text) {
      const textPrompt = CALENDAR_TEXT_PROMPT.replace(
        "{formattedNow}",
        formattedNow
      )
        .replace("{timezone}", timezone)
        .replace("{language}", language);

      console.log("[CalendarAI] Usando prompt per testo:", textPrompt);

      const result = await generateText({
        model: google("models/gemini-2.0-flash-exp"),
        prompt: `${textPrompt}\n${text}`,
        maxTokens: 2048,
        temperature: 1,
        topP: 0.9,
      });
      return { text: result.text };
    } else {
      throw new Error("Deve essere fornito almeno un'immagine o del testo");
    }
  }
}

export async function POST(req: Request) {
  try {
    const { image, text, language = "it" } = await req.json();
    console.log("[API /calendar/ai] Input ricevuto:", {
      hasImage: !!image,
      imageLength: image?.length,
      hasText: !!text,
      textLength: text?.length,
      language,
    });
    const model = google("gemini-2.0-flash");
    const calendarAI = new CalendarAI(model);
    const aiResult = await calendarAI.generateEvents({
      image,
      text,
      language,
    });

    console.log("[API /calendar/ai] Risposta AI:", aiResult.text);

    let raw = aiResult.text
      .replace(/```json|```/g, "")
      .replace(/^json\s*/i, "")
      .trim();
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const parsed = JSON.parse(match?.[0] ?? raw);

    console.log("[API /calendar/ai] Parsed JSON:", parsed);

    let eventsRaw: RawEventFromAI[] = [];
    if (Array.isArray(parsed)) {
      eventsRaw = parsed;
      console.log("[API /calendar/ai] Parsed è un array di eventi");
    } else if (parsed && Array.isArray(parsed.events)) {
      eventsRaw = parsed.events;
      console.log("[API /calendar/ai] Parsed è un oggetto con chiave events");
    } else {
      console.log(
        "[API /calendar/ai] Parsed non riconosciuto, fallback a array vuoto"
      );
    }

    const eventsRawNormalized = eventsRaw.map((ev) => ({
      ...ev,
      location: ev.location == null ? "" : ev.location,
      description: ev.description || "",
    }));

    const events = AICalendarEvent.array().parse(eventsRawNormalized);

    const mappedEvents: CalendarEvent[] = events.map((ev): CalendarEvent => {
      let startDate: Date;
      let endDate: Date;

      try {
        startDate = parseISO(ev.start);
        if (!isValid(startDate)) {
          throw new Error(`Data di inizio non valida: ${ev.start}`);
        }
      } catch (error) {
        console.warn(
          `Errore nel parsing della data di inizio: ${ev.start}`,
          error
        );
        startDate = new Date();
      }

      try {
        endDate = parseISO(ev.end);
        if (!isValid(endDate)) {
          throw new Error(`Data di fine non valida: ${ev.end}`);
        }
      } catch (error) {
        console.warn(`Errore nel parsing della data di fine: ${ev.end}`, error);
        endDate = addHours(startDate, 1);
      }

      const startDateUTC = fromZonedTime(startDate, ev.timezone);
      const endDateUTC = fromZonedTime(endDate, ev.timezone);

      return {
        id: uuidv4(),
        title: ev.title,
        startDate: startDateUTC,
        endDate: endDateUTC,
        timezone: ev.timezone,
        color: "bg-blue-500",
        description: ev.description || "",
        location: ev.location || "",
        attendees: [],
        organizer: "",
      };
    });

    console.log("[API /calendar/ai] Eventi validati e mappati:", mappedEvents);

    const serializedEvents = serializeCalendarEvents(mappedEvents);

    return new Response(JSON.stringify(serializedEvents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const apiError: APIError = {
      message: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };

    console.error("[API /calendar/ai] Errore:", apiError);
    return new Response(JSON.stringify({ error: apiError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
