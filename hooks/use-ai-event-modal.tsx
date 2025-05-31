"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useCalendarAI } from "@/hooks/use-calendar-ai";
import type { AIModalState, CalendarEvent } from "@/utils/types";
import { loadingMessages } from "@/utils/messages";

interface UseAIEventModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (eventData: Partial<CalendarEvent>) => void;
}

export function useAIEventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
}: UseAIEventModalProps) {
  // Modal state
  const [state, setState] = useState<AIModalState>({
    prompt: "",
    image: null,
    file: null,
    generatedEvents: [],
    currentEventIndex: 0,
    showEventModal: false,
    showWarnings: true,
    isCameraOpen: false,
    showLoadingScreen: false,
    currentLoadingMessage: 0,
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<any>(null);

  // AI Hook
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

  // Speech Recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Update prompt with transcript
  useEffect(() => {
    if (!listening && transcript) {
      setState(prev => ({
        ...prev,
        prompt: prev.prompt ? prev.prompt + " " + transcript : transcript
      }));
      resetTranscript();
    }
  }, [listening, transcript, resetTranscript]);

  // Loading messages rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.showLoadingScreen) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          currentLoadingMessage: (prev.currentLoadingMessage + 1) % loadingMessages.length
        }));
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.showLoadingScreen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState(prev => ({
        ...prev,
        showLoadingScreen: false,
        currentLoadingMessage: 0,
      }));
    }
  }, [isOpen]);

  // Handler functions
  const handleMicClick = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ language: "it-IT" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setState(prev => ({ ...prev, file: uploadedFile }));
      if (uploadedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setState(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(uploadedFile);
      } else {
        setState(prev => ({ ...prev, image: null }));
      }
    }
  };

  const handleRemoveFile = () => {
    setState(prev => ({ ...prev, file: null, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startCamera = () => {
    setState(prev => ({ ...prev, isCameraOpen: true }));
  };

  const stopCamera = () => {
    setState(prev => ({ ...prev, isCameraOpen: false }));
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
          setState(prev => ({
            ...prev,
            file,
            image: imageSrc,
            isCameraOpen: false,
          }));
        })
        .catch((error) => {
          console.error("Error processing photo:", error);
          alert("Error processing photo. Please try again.");
        });
    }
  };

  const handleSubmit = async () => {
    console.log("[AI Modal] handleSubmit called!");
    console.log("[AI Modal] Form state:", { prompt: state.prompt, image: state.image, file: state.file });

    if (!state.prompt && !state.image && !state.file) {
      console.log("[AI Modal] No input provided, returning early");
      return;
    }

    console.log("[AI Modal] Clearing previous state...");
    clearWarningsAndConflicts();
    clearError();

    setState(prev => ({
      ...prev,
      showLoadingScreen: true,
      currentLoadingMessage: 0,
    }));

    try {
      let events: any[] = [];
      console.log("[AI Modal] Starting event processing...");

      if (state.prompt || state.image) {
        console.log("[AI Modal] Starting enhanced AI event generation with:", {
          hasPrompt: !!state.prompt,
          hasImage: !!state.image,
          hasFile: !!state.file,
          promptLength: state.prompt?.length,
          imageSize: state.image?.length,
        });

        console.log("[AI Modal] About to call processWithAIEnhanced...");
        events = await processWithAIEnhanced(
          state.prompt || undefined,
          state.image || undefined,
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
      } else if (state.file && !state.image) {
        console.log("Processing non-image file:", state.file.name);
        events = [
          {
            id: uuidv4(),
            title: "Documento caricato",
            description: `Hai caricato il file: ${state.file.name}`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 60 * 1000),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            color: "bg-blue-500",
            location: "",
            attendees: [],
            organizer: "You",
            calendarId: "default",
          },
        ];
      }

      setState(prev => ({ ...prev, showLoadingScreen: false }));

      if (events.length > 0) {
        setState(prev => ({
          ...prev,
          generatedEvents: events,
          currentEventIndex: 0,
          showEventModal: true,
        }));
      }
    } catch (e) {
      console.error("Error during enhanced AI processing:", e);
      
      setState(prev => ({ ...prev, showLoadingScreen: false }));
      
      setState(prev => ({
        ...prev,
        generatedEvents: [
          {
            id: uuidv4(),
            title: "Errore elaborazione AI",
            description: error || "Si è verificato un errore durante l'elaborazione.",
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 60 * 1000),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            color: "bg-red-500",
            location: "",
            attendees: [],
            organizer: "You",
            calendarId: "default",
          },
        ],
        currentEventIndex: 0,
        showEventModal: true,
      }));
    }
  };

  const handleCloseModal = () => {
    setState({
      prompt: "",
      image: null,
      file: null,
      generatedEvents: [],
      currentEventIndex: 0,
      showEventModal: false,
      showWarnings: true,
      isCameraOpen: false,
      showLoadingScreen: false,
      currentLoadingMessage: 0,
    });
    clearWarningsAndConflicts();
    clearError();
    onCloseAction();
  };

  const handleSaveEvent = (eventData: any) => {
    onSaveAction(eventData);
    if (state.currentEventIndex < state.generatedEvents.length - 1) {
      setState(prev => ({ ...prev, currentEventIndex: prev.currentEventIndex + 1 }));
    } else {
      handleCloseModal();
    }
  };

  const handleDeleteEvent = () => {
    const newEvents = state.generatedEvents.filter(
      (_, idx) => idx !== state.currentEventIndex
    );
    if (newEvents.length === 0) {
      handleCloseModal();
      return;
    }
    setState(prev => ({
      ...prev,
      generatedEvents: newEvents,
      currentEventIndex: Math.min(prev.currentEventIndex, newEvents.length - 1),
    }));
  };

  const handleModifyEvent = (eventData: any) => {
    const newEvents = [...state.generatedEvents];
    newEvents[state.currentEventIndex] = eventData;
    setState(prev => ({ ...prev, generatedEvents: newEvents }));
  };

  const setPrompt = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };

  const setShowWarnings = (show: boolean) => {
    setState(prev => ({ ...prev, showWarnings: show }));
  };

  const setCurrentEventIndex = (index: number) => {
    setState(prev => ({ ...prev, currentEventIndex: index }));
  };

  const setShowEventModal = (show: boolean) => {
    setState(prev => ({ ...prev, showEventModal: show }));
  };

  return {
    // State
    ...state,
    
    // Loading messages
    loadingMessages,
    
    // AI state
    loading,
    error,
    warnings,
    conflicts,
    lastMetadata,
    
    // Speech recognition state
    listening,
    browserSupportsSpeechRecognition,
    
    // Refs
    fileInputRef,
    cameraRef,
    
    // Handlers
    handleMicClick,
    handleFileUpload,
    handleRemoveFile,
    startCamera,
    stopCamera,
    capturePhoto,
    handleSubmit,
    handleCloseModal,
    handleSaveEvent,
    handleDeleteEvent,
    handleModifyEvent,
    
    // AI handlers
    clearError,
    clearWarningsAndConflicts,
    
    // Setters
    setPrompt,
    setShowWarnings,
    setCurrentEventIndex,
    setShowEventModal,
  };
}
