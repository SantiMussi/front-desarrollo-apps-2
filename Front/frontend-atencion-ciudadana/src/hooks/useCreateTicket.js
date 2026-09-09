import { useState, useCallback } from "react";
import { createTicket } from "../services/apiClient";

export function useCreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [trackingCode, setTrackingCode] = useState(null);

  const submit = useCallback(async (payload, attachments = []) => {
    console.log("[useCreateTicket] Payload:", payload, "Attachments:", attachments);
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setTrackingCode(null);

    try {
      // Simular delay y error aleatorio para testing (30% de las veces)
      if (Math.random() < 0.3) {
        await new Promise((r) => setTimeout(r, 800));
        const error = new Error("No se pudo conectar con el servidor. Intentá nuevamente en unos minutos.");
        error.code = "NETWORK_ERROR";
        throw error;
      }

      const response = await createTicket(payload, attachments);
      console.log("[useCreateTicket] Respuesta del backend:", response);
      setTrackingCode(response.trackingCode);
      return response.trackingCode;
    } catch (err) {
      console.error("[useCreateTicket] Error del backend:", err);
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
  }, []);

  return { submit, loading, error, errorCode, trackingCode, reset, setError, setErrorCode };
}
