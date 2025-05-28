"use client";

import * as React from "react";

import { useState, useRef } from "react";
import { X, Upload, Sparkles, Loader2, Mic } from "lucide-react";
import { FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EventModal } from "@/components/event-modal";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { aiToCalendarEvents } from "@/utils/API";
import { v4 as uuidv4 } from "uuid";
import type { AIEventModalProps } from "@/utils/types";

export function AIEventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
}: AIEventModalProps) {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedEvents, setGeneratedEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  React.useEffect(() => {
    if (!listening && transcript) {
      setPrompt((prev) => (prev ? prev + " " + transcript : transcript));
      resetTranscript();
    }
    // eslint-disable-next-line
  }, [listening]);

  const handleMicClick = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ language: "it-IT" });
    }
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      if (uploadedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(uploadedFile);
      } else {
        setImage(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleSubmit = async () => {
    if (!prompt && !image && !file) return;
    setIsProcessing(true);
    try {
      let events: any[] = [];

      try {
        console.log("Starting event generation with:", {
          hasPrompt: !!prompt,
          hasImage: !!image,
          hasFile: !!file,
          promptLength: prompt?.length,
          imageSize: image?.length,
        });

        if (prompt || image) {
          console.log("Calling aiToCalendarEvents API...");
          events = await aiToCalendarEvents(
            prompt || undefined,
            image || undefined,
            "it",
          );
          console.log("API Response received:", events);
        } else if (file && !image) {
          console.log("Processing non-image file:", file.name);
          events = [
            {
              title: "Documento caricato",
              description: `Hai caricato il file: ${file.name}`,
            },
          ];
        }

        console.log("Processing events before formatting:", events);

        events = events.map((ev) => {
          const now = new Date();
          const startDate = ev.start ? new Date(ev.start) : now;
          const endDate = ev.end
            ? new Date(ev.end)
            : new Date(now.getTime() + 60 * 60 * 1000);

          return {
            id: uuidv4(),
            title: ev.title,
            startDate,
            endDate,
            timezone:
              ev.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            color: "bg-blue-500",
            description: ev.description || "",
            location: ev.location || "",
            attendees: [],
            organizer: "You",
          };
        });

        console.log("Final processed events:", events);
      } catch (e) {
        console.error("Error during event processing:", e);
        if (typeof e === "object" && e !== null) {
          console.error("Error details:", {
            name: (e as any).name,
            message: (e as any).message,
            stack: (e as any).stack,
          });
        }
        events = [
          {
            title: "Errore di elaborazione",
            description:
              "Si è verificato un errore durante l'elaborazione della richiesta.",
          },
        ];
      }

      setGeneratedEvents(events);
      setCurrentEventIndex(0);
      setShowEventModal(true);
    } catch (e) {
      console.error("Errore durante la chiamata API:", e);
      setGeneratedEvents([
        {
          title: "Errore chiamata API",
          description: String(e),
        },
      ]);
      setCurrentEventIndex(0);
      setShowEventModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEvent = (eventData: any) => {
    onSaveAction(eventData);
    if (currentEventIndex < generatedEvents.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    } else {
      setShowEventModal(false);
      onCloseAction();
      setPrompt("");
      setImage(null);
      setFile(null);
      setGeneratedEvents([]);
      setCurrentEventIndex(0);
    }
  };

  const handleDeleteEvent = () => {
    const newEvents = generatedEvents.filter(
      (_, idx) => idx !== currentEventIndex,
    );
    if (newEvents.length === 0) {
      setShowEventModal(false);
      onCloseAction();
      setPrompt("");
      setImage(null);
      setFile(null);
      setGeneratedEvents([]);
      setCurrentEventIndex(0);
      return;
    }
    setGeneratedEvents(newEvents);
    setCurrentEventIndex(Math.min(currentEventIndex, newEvents.length - 1));
  };

  const handleModifyEvent = (eventData: any) => {
    const newEvents = [...generatedEvents];
    newEvents[currentEventIndex] = eventData;
    setGeneratedEvents(newEvents);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              Create Event with AI
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseAction}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-white/70 mb-2">
                Describe your event or upload an image, and AI will help create
                it for you.
              </p>
              <div className="relative">
                <Textarea
                  placeholder="Describe your event... (e.g., 'Team meeting with marketing department to discuss Q3 campaign strategy')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px] pr-12"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "absolute top-2 right-2 bg-black/30 hover:bg-black/50",
                            listening && "bg-purple-600 animate-pulse",
                            !browserSupportsSpeechRecognition && "bg-red-700/80 hover:bg-red-800/90"
                          )}
                          onClick={handleMicClick}
                          aria-label={listening ? "Stop recording" : "Start recording"}
                          disabled={!browserSupportsSpeechRecognition}
                        >
                          <Mic className={cn("h-5 w-5", !browserSupportsSpeechRecognition && "text-red-400 animate-pulse")} />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!browserSupportsSpeechRecognition && (
                      <TooltipContent side="top">
                        Il riconoscimento vocale non è supportato sui browser non Chromium-based.
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/70">
                Upload an image or document (optional)
              </p>

              {file ? (
                <div className="relative rounded-lg overflow-hidden bg-black/30 p-4 flex items-center gap-3">
                  {image ? (
                    <img
                      src={image || "/placeholder.svg"}
                      alt="Uploaded"
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-white/10 rounded">
                      <Upload className="h-8 w-8 text-white/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-white/50">
                      {file.type || "Documento"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 text-white hover:bg-black/70 rounded-full h-8 w-8"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-white/50" />
                  <p className="text-white/70">
                    Click to upload an image or document
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    PNG, JPG, GIF, PDF, DOCX, DOC, ODT up to 5MB
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-white/20">
            <Button
              variant="outline"
              onClick={onCloseAction}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || (!prompt && !image)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Event
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Event Modal per ogni evento generato con navigazione */}
      {showEventModal && generatedEvents.length > 0 && (
        <div>
          <EventModal
            isOpen={showEventModal}
            onCloseAction={() => setShowEventModal(false)}
            onSaveAction={handleSaveEvent}
            onDelete={handleDeleteEvent}
            onModify={handleModifyEvent}
            event={generatedEvents[currentEventIndex]}
            mode="edit"
            onPrev={() => setCurrentEventIndex((i) => Math.max(0, i - 1))}
            onNext={() =>
              setCurrentEventIndex((i) =>
                Math.min(generatedEvents.length - 1, i + 1),
              )
            }
            canPrev={currentEventIndex > 0}
            canNext={currentEventIndex < generatedEvents.length - 1}
            eventIndex={currentEventIndex}
            eventCount={generatedEvents.length}
          />
          {generatedEvents.length > 1 && (
            <div className="flex justify-between items-center mt-2 px-4">
              <Button
                onClick={() => setCurrentEventIndex((i) => Math.max(0, i - 1))}
                disabled={currentEventIndex === 0}
                className="bg-white/10 text-white flex items-center justify-center"
                aria-label="Evento precedente"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </Button>
              <span className="text-white/70">
                Evento {currentEventIndex + 1} di {generatedEvents.length}
              </span>
              <Button
                onClick={() =>
                  setCurrentEventIndex((i) =>
                    Math.min(generatedEvents.length - 1, i + 1),
                  )
                }
                disabled={currentEventIndex === generatedEvents.length - 1}
                className="bg-white/10 text-white flex items-center justify-center"
                aria-label="Evento successivo"
              >
                <FiChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
