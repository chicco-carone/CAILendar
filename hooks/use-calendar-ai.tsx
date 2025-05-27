import { useState } from "react";
import { CalendarEvent } from "@/lib/ical-utils";
import {
  textToCalendarEvents,
  imageToCalendarEvents,
  exportEventToIcal,
  importEventsFromIcal,
} from "@/utils/API";

/**
 * Hook personalizzato per la gestione degli eventi del calendario tramite AI
 * @returns Funzioni e stati per interagire con le API AI del calendario
 */
export const useCalendarAI = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  return {
    loading,
    error,
    processTextToEvents,
    processImagesToEvents,
    exportToIcal,
    importFromIcal,
  };
};
