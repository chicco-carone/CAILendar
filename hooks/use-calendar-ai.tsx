import { useState } from "react";
import { CalendarEvent } from "@/utils/types";
import {
  textToCalendarEvents,
  imageToCalendarEvents,
  aiToCalendarEventsEnhanced,
  aiToCalendarEvents,
  exportEventToIcal,
  importEventsFromIcal,
} from "@/utils/API";
import type { AIConflictInfo, AIResponseMetadata } from "@/utils/types";

/**
 * Hook personalizzato per la gestione degli eventi del calendario tramite AI
 * @returns Funzioni e stati per interagire con le API AI del calendario
 */
export const useCalendarAI = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<AIConflictInfo[]>([]);
  const [lastMetadata, setLastMetadata] = useState<AIResponseMetadata | null>(
    null,
  );

  /**
   * Converte il testo in eventi del calendario
   * @param text Testo contenente informazioni sugli eventi
   * @param language Lingua del testo (default: 'it')
   */
  const processTextToEvents = async (
    text: string,
    language: string = "it",
  ): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      const events = await textToCalendarEvents(text, language);
      return events;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Errore sconosciuto";
      setError(`Errore nella conversione del testo in eventi: ${errorMessage}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Converte immagini in eventi del calendario
   * @param images Array di URL o stringhe base64 delle immagini
   * @param text Testo opzionale di contesto
   * @param language Lingua preferita (default: 'it')
   */
  const processImagesToEvents = async (
    images: string[],
    text: string = "",
    language: string = "it",
  ): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      const events = await imageToCalendarEvents(images, text, language);
      return events;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Errore sconosciuto";
      setError(
        `Errore nella conversione delle immagini in eventi: ${errorMessage}`,
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Processa testo e/o immagini con AI (versione avanzata con metadata)
   * @param text Testo opzionale contenente informazioni sugli eventi
   * @param image Immagine opzionale come stringa base64 o data URL
   * @param language Lingua preferita (default: 'it')
   * @param includeContext Se includere il contesto del calendario per il rilevamento conflitti
   */
  const processWithAIEnhanced = async (
    text?: string,
    image?: string,
    language: string = "it",
    includeContext: boolean = true,
  ): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setConflicts([]);
    setLastMetadata(null);

    try {
      const result = await aiToCalendarEventsEnhanced(
        text,
        image,
        language,
        includeContext,
      );

      // Update state with metadata
      setWarnings(result.metadata.warnings);
      setConflicts(result.metadata.conflicts);
      setLastMetadata(result.metadata);

      console.log(
        `[Hook] [AI-${result.metadata.requestId}] Processing completed:`,
        {
          eventsGenerated: result.events.length,
          parsingMethod: result.metadata.parsingMethod,
          warningsCount: result.metadata.warnings.length,
          conflictsCount: result.metadata.conflicts.length,
          calendarContext: result.metadata.calendarContext,
        },
      );

      console.log("[Hook] Full result object:", result);
      console.log("[Hook] Events being returned:", result.events);
      console.log("[Hook] First event being returned:", result.events[0]);

      return result.events;
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : "Errore sconosciuto";
      const requestId = err.requestId ? ` [${err.requestId}]` : "";
      const errorCode = err.code ? ` (${err.code})` : "";

      setError(
        `Errore nell'elaborazione AI${requestId}${errorCode}: ${errorMessage}`,
      );

      console.error("Enhanced AI processing failed:", {
        error: err,
        code: err.code,
        retryable: err.retryable,
        requestId: err.requestId,
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Processa testo e/o immagini con AI (versione legacy)
   * @param text Testo opzionale contenente informazioni sugli eventi
   * @param image Immagine opzionale come stringa base64 o data URL
   * @param language Lingua preferita (default: 'it')
   */
  const processWithAI = async (
    text?: string,
    image?: string,
    language: string = "it",
  ): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setConflicts([]);

    try {
      const events = await aiToCalendarEvents(text, image, language);
      return events;
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : "Errore sconosciuto";
      const requestId = err.requestId ? ` [${err.requestId}]` : "";
      const errorCode = err.code ? ` (${err.code})` : "";

      setError(
        `Errore nell'elaborazione AI${requestId}${errorCode}: ${errorMessage}`,
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Esporta un evento in formato iCal
   * @param event Evento da esportare
   */
  const exportToIcal = async (event: CalendarEvent): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const icalData = await exportEventToIcal(event);
      return icalData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Errore sconosciuto";
      setError(`Errore nell'esportazione dell'evento in iCal: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Importa eventi da un file iCal
   * @param icalData Stringa contenente dati iCal
   */
  const importFromIcal = async (icalData: string): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      const events = await importEventsFromIcal(icalData);
      return events;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Errore sconosciuto";
      setError(
        `Errore nell'importazione degli eventi da iCal: ${errorMessage}`,
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pulisce warnings e conflicts
   */
  const clearWarningsAndConflicts = () => {
    setWarnings([]);
    setConflicts([]);
    setLastMetadata(null);
  };

  /**
   * Pulisce tutti gli stati di errore
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Ottiene un riepilogo dello stato corrente
   */
  const getProcessingStatus = () => ({
    loading,
    hasWarnings: warnings.length > 0,
    hasConflicts: conflicts.length > 0,
    hasError: !!error,
    lastRequestId: lastMetadata?.requestId,
    parsingMethod: lastMetadata?.parsingMethod,
  });

  return {
    // Stati
    loading,
    error,
    warnings,
    conflicts,
    lastMetadata,

    // Funzioni principali
    processTextToEvents,
    processImagesToEvents,
    processWithAI,
    processWithAIEnhanced,
    exportToIcal,
    importFromIcal,

    // Utility
    clearWarningsAndConflicts,
    clearError,
    getProcessingStatus,
  };
};
