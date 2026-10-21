import { useCallback, useEffect, useRef, useState } from "react";
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
  const [loadedId, setLoadedId] = useState(null);
  const generation = useRef(0);
  const request = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const current = ++request.current;
    const context = generation.current;
    if (!ticketId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketCitizenView(ticketId);
      if (current !== request.current || context !== generation.current) return;
      setLoadedId(ticketId);
      setView(data);
    } catch (err) {
      if (current !== request.current || context !== generation.current) return;
      setLoadedId(ticketId);
      setView(null);
      setError(messageForError(err));
    } finally {
      if (current === request.current && context === generation.current) setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
      generation.current += 1;
    };
  }, [load]);

  return { view: loadedId === ticketId ? view : null, loading: Boolean(ticketId) && (loadedId !== ticketId || loading), error: loadedId === ticketId ? error : null, reload: load };
}
