import { useCallback, useEffect, useState } from "react";
import { fetchTicketCitizenView } from "../services/apiClient";

function messageForError(err) {
  const status = err?.status;
  if (status === 403) return "No tenés permiso para ver este ticket como ciudadano.";
  if (status === 404) return "No encontramos el ticket.";
  if (status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos cargar la vista del ciudadano. Intentá de nuevo.";
}

export function useTicketCitizenView(ticketId) {
  const [view, setView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!ticketId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketCitizenView(ticketId);
      setView(data);
    } catch (err) {
      setView(null);
      setError(messageForError(err));
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { view, loading, error, reload: load };
}
