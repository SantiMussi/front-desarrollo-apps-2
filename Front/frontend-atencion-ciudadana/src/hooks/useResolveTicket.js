import { useCallback, useState } from "react";
import { resolveTicket } from "../services/apiClient";

function messageForError(err) {
  const status = err?.status;
  const code = err?.code;
  if (status === 409 || code === "TICKET_RESOLUTION_CONFLICT") {
    return (
      err?.message ||
      "El estado actual del ticket o su área responsable no permiten la resolución manual."
    );
  }
  if (status === 403 || code === "FORBIDDEN") {
    return "No tenés permiso para resolver este ticket.";
  }
  if (status === 404) return "No encontramos el ticket.";
  if (status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (status === 400) {
    return err?.message || "Faltan datos obligatorios de la resolución.";
  }
  return err?.message || "No pudimos registrar la resolución. Intentá de nuevo.";
}

export function useResolveTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [resolution, setResolution] = useState(null);

  const resolve = useCallback(async (ticketId, payload) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const data = await resolveTicket(ticketId, payload);
      setResolution(data);
      return data;
    } catch (err) {
      setError(messageForError(err));
      setErrorCode(err?.code || err?.status || null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setErrorCode(null);
    setResolution(null);
  }, []);

  return { resolve, loading, error, errorCode, resolution, reset };
}
