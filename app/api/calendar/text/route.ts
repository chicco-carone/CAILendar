import { z } from "zod";
import { type CalendarEvent as ICalEvent } from "@/utils/types";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { v4 as uuidv4 } from "uuid";
import { CALENDAR_TEXT_PROMPT } from "@/lib/prompts";

const CalendarEvent = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string(),
  timezone: z.string(),
  location: z.string().optional(),
});

const CalendarEvents = z.object({
  events: z.array(CalendarEvent),
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

export class CalendarTextAI {
  private model: any;
  constructor(model: any) {
    this.model = model;
  }

  async generateEvents({
    text,
    language = "it",
  }: {
    text: string;
    language?: string;
  }) {
    const now = new Date();
    const formattedNow = formatDate(now);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const systemPrompt = CALENDAR_TEXT_PROMPT.replace(
      "{formattedNow}",
      formattedNow,
    )
      .replace("{timezone}", timezone)
      .replace("{language}", language);

    console.log("[CalendarTextAI] Prompt generato:", systemPrompt);
    console.log("[CalendarTextAI] text:", text);
    console.log("[CalendarTextAI] language:", language);

    const result = await generateText({
      model: google("models/gemini-2.0-flash-exp"),
      prompt: `${systemPrompt}\n${text}`,
      maxTokens: 2048,
      temperature: 1,
      topP: 0.9,
    });
    return { text: result.text };
  }
}

export async function POST(req: Request) {
  try {
    const { text: userText, language = "it" } = await req.json();
    console.log("[API /calendar/text] Input ricevuto:", { userText, language });
    const model = google("gemini-2.0-flash");
    const calendarAI = new CalendarTextAI(model);
    const aiResult = await calendarAI.generateEvents({
      text: userText,
      language,
    });

    console.log("[API /calendar/text] Risposta AI:", aiResult.text);

    let raw = aiResult.text
      .replace(/```json|```/g, "")
      .replace(/^json\s*/i, "")
      .trim();
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const parsed = JSON.parse(match?.[0] ?? raw);

    console.log("[API /calendar/text] Parsed JSON:", parsed);

    let eventsRaw: any[] = [];
    if (Array.isArray(parsed)) {
      eventsRaw = parsed;
      console.log("[API /calendar/text] Parsed è un array di eventi");
    } else if (parsed && Array.isArray(parsed.events)) {
      eventsRaw = parsed.events;
      console.log("[API /calendar/text] Parsed è un oggetto con chiave events");
    } else {
      console.log(
        "[API /calendar/text] Parsed non riconosciuto, fallback a array vuoto",
      );
    }

    const eventsRawNormalized = eventsRaw.map((ev) => ({
      ...ev,
      location: ev.location == null ? "" : ev.location,
    }));

    const events = CalendarEvent.array().parse(eventsRawNormalized);

    const mappedEvents: ICalEvent[] = events.map((ev, idx) => ({
      id: uuidv4(),
      title: ev.title,
      startTime: ev.start.substring(11, 16),
      endTime: ev.end.substring(11, 16),
      color: "bg-blue-500",
      day: 1,
      description: "",
      location: ev.location == null ? "" : ev.location,
      attendees: [],
      organizer: "",
      date: ev.start.substring(5, 10).replace("-", " "),
    }));

    console.log(
      "[API /calendar/text] Eventi validati e mappati:",
      mappedEvents,
    );

    return new Response(JSON.stringify(mappedEvents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[API /calendar/text] Errore:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
