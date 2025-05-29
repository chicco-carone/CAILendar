"use client";

import * as React from "react";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  Mic,
  AlertTriangle,
  Info,
  Clock,
  Camera,
} from "lucide-react";
import { FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EventModal } from "@/components/event-modal";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useCalendarAI } from "@/hooks/use-calendar-ai";
import { v4 as uuidv4 } from "uuid";
import { Camera as CameraPro } from "react-camera-pro";
import type { AIEventModalProps, AIConflictInfo } from "@/utils/types";

const loadingMessages = [
  "Sto analizzando i tuoi dati...",
  "L'intelligenza artificiale sta elaborando le informazioni...",
  "Creando eventi perfetti per te...",
  "Ottimizzando date e orari...",
  "Quasi pronto, un ultimo controllo..."
];

export function AIEventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
}: AIEventModalProps) {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [generatedEvents, setGeneratedEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);  const [showWarnings, setShowWarnings] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const cameraRef = useRef<any>(null);

  const {
    loading,
    error,
    warnings,
    conflicts,
    lastMetadata,
    processWithAIEnhanced,
    clearError,
    clearWarningsAndConflicts,
  } = useCalendarAI();

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
  // Effect per il ciclo dei messaggi di caricamento
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showLoadingScreen) {
      interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000); // Cambia messaggio ogni 2 secondi
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showLoadingScreen]);

  // Effect per resettare lo stato quando il modal si chiude
  React.useEffect(() => {
    if (!isOpen) {
      setShowLoadingScreen(false);
      setCurrentLoadingMessage(0);
    }
  }, [isOpen]);

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

  const handleCloseModal = () => {
    setShowLoadingScreen(false);
    setCurrentLoadingMessage(0);
    setPrompt("");
    setImage(null);
    setFile(null);
    setGeneratedEvents([]);
    setCurrentEventIndex(0);
    setShowEventModal(false);
    clearWarningsAndConflicts();
    clearError();
    onCloseAction();
  };

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

  const startCamera = () => {
    setIsCameraOpen(true);
  };

  const stopCamera = () => {
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (cameraRef.current) {
      const imageSrc = cameraRef.current.takePhoto();

      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          setFile(file);
          setImage(imageSrc);
          stopCamera();
        })
        .catch((error) => {
          console.error("Error processing photo:", error);
          alert("Error processing photo. Please try again.");
        });
    }
  };
  const handleSubmit = async () => {
    console.log("[AI Modal] handleSubmit called!");
    console.log("[AI Modal] Form state:", { prompt, image, file });

    if (!prompt && !image && !file) {
      console.log("[AI Modal] No input provided, returning early");
      return;
    }

    console.log("[AI Modal] Clearing previous state...");
    clearWarningsAndConflicts();
    clearError();

    // Mostra la schermata di caricamento
    setShowLoadingScreen(true);
    setCurrentLoadingMessage(0);

    try {
      let events: any[] = [];
      console.log("[AI Modal] Starting event processing...");

      if (prompt || image) {
        console.log("[AI Modal] Starting enhanced AI event generation with:", {
          hasPrompt: !!prompt,
          hasImage: !!image,
          hasFile: !!file,
          promptLength: prompt?.length,
          imageSize: image?.length,
        });

        console.log("[AI Modal] About to call processWithAIEnhanced...");
        events = await processWithAIEnhanced(
          prompt || undefined,
          image || undefined,
          "it",
          true
        );

        console.log("[AI Modal] processWithAIEnhanced completed!");
        console.log("[AI Modal] Enhanced AI Response received:", {
          eventsCount: events.length,
          warningsCount: warnings.length,
          conflictsCount: conflicts.length,
          requestId: lastMetadata?.requestId,
        });

        console.log("[AI Modal] Raw events from API:", events);
        console.log("[AI Modal] First event detailed:", events[0]);
      } else if (file && !image) {
        console.log("Processing non-image file:", file.name);
        events = [
          {
            id: uuidv4(),
            title: "Documento caricato",
            description: `Hai caricato il file: ${file.name}`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 60 * 1000),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            color: "bg-blue-500",
            location: "",
            attendees: [],
            organizer: "You",
          },
        ];
      }

      // Nascondi la schermata di caricamento
      setShowLoadingScreen(false);

      if (events.length > 0) {
        setGeneratedEvents(events);
        setCurrentEventIndex(0);
        setShowEventModal(true);
      }
    } catch (e) {
      console.error("Error during enhanced AI processing:", e);
      
      // Nascondi la schermata di caricamento anche in caso di errore
      setShowLoadingScreen(false);
      
      setGeneratedEvents([
        {
          id: uuidv4(),
          title: "Errore elaborazione AI",
          description:
            error || "Si è verificato un errore durante l'elaborazione.",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 60 * 1000),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          color: "bg-red-500",
          location: "",
          attendees: [],
          organizer: "You",
        },
      ]);
      setCurrentEventIndex(0);
      setShowEventModal(true);
    }
  };

  const handleSaveEvent = (eventData: any) => {    onSaveAction(eventData);
    if (currentEventIndex < generatedEvents.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    } else {
      setShowEventModal(false);
      handleCloseModal();
    }
  };
  const handleDeleteEvent = () => {
    const newEvents = generatedEvents.filter(
      (_, idx) => idx !== currentEventIndex
    );
    if (newEvents.length === 0) {
      setShowEventModal(false);
      handleCloseModal();
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return AlertTriangle;
      case "medium":
        return Clock;
      case "low":
        return Info;
      default:
        return Info;
    }
  };
  return (
    <>
      {/* Schermata di caricamento */}
      {showLoadingScreen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 mx-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center space-y-6">
              {/* Logo che gira */}
              <div className="relative">
                <img
                  src="/logo.svg"
                  alt="CAILendar Logo"
                  className="w-16 h-16 animate-spin"
                  style={{
                    animationDuration: '3s',
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite'
                  }}
                />
              </div>
              
              {/* Messaggio di caricamento */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Elaborazione in corso...
                </h3>
                <p 
                  className="text-white/70 text-sm transition-all duration-500 ease-in-out min-h-[20px]"
                  key={currentLoadingMessage}
                >
                  {loadingMessages[currentLoadingMessage]}
                </p>
              </div>
              
              {/* Barra di caricamento animata */}
              <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center",
        showLoadingScreen && "hidden"
      )}>
        <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              Create Event with AI
              {lastMetadata && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {lastMetadata.parsingMethod}
                </Badge>
              )}
            </h2>            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseModal}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Error Display */}
            {error && (
              <div className="p-4 pb-0">
                <Alert className="bg-red-500/20 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-white">
                    {error}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="ml-2 text-white hover:bg-white/10"
                    >
                      Dismiss
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Warnings Display */}
            {warnings.length > 0 && showWarnings && (
              <div className="p-4 pb-0">
                <Alert className="bg-yellow-500/20 border-yellow-500/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>AI Processing Warnings:</strong>
                        <ul className="mt-1 text-sm">
                          {warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWarnings(false)}
                        className="text-white hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Conflicts Display */}
            {conflicts.length > 0 && (
              <div className="p-4 pb-0">
                <Alert className="bg-orange-500/20 border-orange-500/50">
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-white">
                    <strong>Scheduling Conflicts Detected:</strong>
                    <div className="mt-2 space-y-2">
                      {conflicts.map((conflict, idx) => {
                        const SeverityIcon = getSeverityIcon(conflict.severity);
                        return (
                          <div key={idx} className="flex items-start gap-2">
                            <Badge
                              className={`${getSeverityColor(conflict.severity)} text-white`}
                            >
                              <SeverityIcon className="h-3 w-3 mr-1" />
                              {conflict.severity}
                            </Badge>
                            <div className="text-sm">
                              <div className="font-medium">
                                {conflict.eventTitle}
                              </div>
                              <div className="text-white/80">
                                {conflict.suggestion}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-white/70 mb-2">
                  Describe your event or upload an image, and AI will help
                  create it for you.
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
                              !browserSupportsSpeechRecognition &&
                                "bg-red-700/80 hover:bg-red-800/90"
                            )}
                            onClick={handleMicClick}
                            aria-label={
                              listening ? "Stop recording" : "Start recording"
                            }
                            disabled={!browserSupportsSpeechRecognition}
                          >
                            <Mic
                              className={cn(
                                "h-5 w-5",
                                !browserSupportsSpeechRecognition &&
                                  "text-red-400 animate-pulse"
                              )}
                            />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!browserSupportsSpeechRecognition && (
                        <TooltipContent side="top">
                          Il riconoscimento vocale non è supportato sui browser
                          non Chromium-based.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/70">
                    Upload an image or document (optional)
                  </p>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={startCamera}
                            className="border-white/20 text-white hover:bg-white/10"
                            disabled={isCameraOpen}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Camera
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Take a photo with your camera
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

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

                {isCameraOpen && (
                  <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-white/20">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                          <Camera className="h-5 w-5 mr-2" />
                          Take a Photo
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={stopCamera}
                          className="text-white hover:bg-white/10"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <div className="relative bg-black rounded-lg overflow-hidden h-64">
                          <CameraPro
                            ref={cameraRef}
                            aspectRatio={16 / 9}
                            facingMode="environment"
                            errorMessages={{
                              noCameraAccessible:
                                "No camera device accessible. Please connect your camera or try a different browser.",
                              permissionDenied:
                                "Permission denied. Please refresh and give camera permission.",
                              switchCamera:
                                "It is not possible to switch camera to different one because there is only one video device accessible.",
                              canvas: "Canvas is not supported.",
                            }}
                          />
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                          <Button
                            variant="outline"
                            onClick={stopCamera}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={capturePhoto}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Capture
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>          <div className="flex justify-end gap-2 p-4 border-t border-white/20">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button><Button
              onClick={handleSubmit}
              disabled={loading || showLoadingScreen || (!prompt && !image)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {loading ? (
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
                Math.min(generatedEvents.length - 1, i + 1)
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
                    Math.min(generatedEvents.length - 1, i + 1)
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
