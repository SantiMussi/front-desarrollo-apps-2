import { useState, useCallback } from "react";

// TODO: import { createTicket } from "../services/apiClient";

function generateTrackingCode() {
  const prefix = "REC";
  const number = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${number}`;
}

export function useCreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingCode, setTrackingCode] = useState(null);

  const submit = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    setTrackingCode(null);

    try {
      // TODO: Reemplazar mock por llamada real al backend
      // const response = await createTicket(payload);
      // setTrackingCode(response.trackingNumber);

      await new Promise((r) => setTimeout(r, 1500));

      // Simular error aleatorio para testing (10% de las veces)
      if (Math.random() < 0.1) {
        throw new Error("No se pudo conectar con el servidor. Intentá nuevamente en unos minutos.");
      }

      const code = generateTrackingCode();
      setTrackingCode(code);
      return code;
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado. Intentá de nuevo.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setTrackingCode(null);
  }, []);

  return { submit, loading, error, trackingCode, reset };
}
