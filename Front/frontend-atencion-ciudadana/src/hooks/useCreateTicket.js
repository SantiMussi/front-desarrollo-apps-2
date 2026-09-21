import { useState, useCallback } from "react";
import { createTicket } from "../services/apiClient";

export function useCreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [trackingCode, setTrackingCode] = useState(null);
  const [ticketPassword, setTicketPassword] = useState(null);

  const submit = useCallback(async (payload, attachments = [], options = {}) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setTrackingCode(null);
    setTicketPassword(null);

    try {
      const response = await createTicket(payload, attachments, options);
      setTrackingCode(response.trackingCode);
      setTicketPassword(response.generatedAnonymousAccessPassword ?? null);
      return response.trackingCode;
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado. Intentá de nuevo.");
      setErrorCode(err.code || err.status || null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setErrorCode(null);
    setTrackingCode(null);
    setTicketPassword(null);
  }, []);

  return { submit, loading, error, errorCode, trackingCode, ticketPassword, reset, setError, setErrorCode };
}
