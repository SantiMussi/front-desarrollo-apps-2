import { useState, useCallback, useRef, useEffect } from "react";
import { createTicket } from "../services/apiClient";

export function useCreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [trackingCode, setTrackingCode] = useState(null);
  const [ticketPassword, setTicketPassword] = useState(null);
  const inFlight = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);

  const submit = useCallback(async (payload, attachments = [], options = {}) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    const current = generation.current;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setTrackingCode(null);
    setTicketPassword(null);

    try {
      const response = await createTicket(payload, attachments, options);
      if (current !== generation.current) return null;
      if (!response?.trackingCode) throw new Error("El servidor no confirmó el código de seguimiento. Verificá el resultado antes de volver a enviar.");
      setTrackingCode(response.trackingCode);
      setTicketPassword(response.generatedAnonymousAccessPassword ?? null);
      return response.trackingCode;
    } catch (err) {
      if (current !== generation.current) return null;
      setError(err.message || "Ocurrió un error inesperado. Intentá de nuevo.");
      setErrorCode(err.code || err.status || null);
      return null;
    } finally {
      if (current === generation.current) { inFlight.current = false; setLoading(false); }
    }
  }, []);

  const reset = useCallback(() => {
    generation.current += 1;
    inFlight.current = false;
    setLoading(false);
    setError(null);
    setErrorCode(null);
    setTrackingCode(null);
    setTicketPassword(null);
  }, []);

  return { submit, loading, error, errorCode, trackingCode, ticketPassword, reset, setError, setErrorCode };
}
