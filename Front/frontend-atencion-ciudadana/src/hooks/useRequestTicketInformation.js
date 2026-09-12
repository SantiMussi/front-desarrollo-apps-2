import { useCallback, useState } from "react";
import { requestTicketInformation } from "../services/apiClient";

function messageForError(err) {
  const status = err?.status;
  const code = err?.code;
  if (status === 409 || code === "INFORMATION_REQUEST_CONFLICT") {
    return err?.message || "El ticket ya tiene una solicitud de información pendiente o su estado no lo permite.";
  }
  if (status === 403) return "No tenés permiso para solicitar información en este ticket.";
  if (status === 404) return "No encontramos el ticket.";
  if (status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (status === 400) return err?.message || "Faltan datos obligatorios de la solicitud.";
  return err?.message || "No pudimos registrar la solicitud de información. Intentá de nuevo.";
}

export function useRequestTicketInformation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestInformation = useCallback(async (ticketId, payload) => {
    setLoading(true);
    setError(null);
    try {
      return await requestTicketInformation(ticketId, payload);
    } catch (err) {
      setError(messageForError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { requestInformation, loading, error, reset };
}
