import { useState, useCallback } from "react";
// import { createTicket } from "../services/apiClient";

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
      // Simular delay de red
      await new Promise((r) => setTimeout(r, 1500));

      // Simular error aleatorio para testing (10% de las veces)
      if (Math.random() < 0.1) {
        throw new Error("No se pudo conectar con el servidor. Intentá nuevamente en unos minutos.");
      }

      const code = generateTrackingCode();
      console.log("[useCreateTicket] Respuesta esperada del backend:", {
        trackingNumber: code,
        status: "REGISTRADO",
        createdAt: new Date().toISOString(),
      });
      setTrackingCode(code);
      return code;
    } catch (err) {
      console.error("[useCreateTicket] Error del backend:", err.message);
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
