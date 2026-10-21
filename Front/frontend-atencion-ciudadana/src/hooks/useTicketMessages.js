import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchTicketMessages,
  createTicketMessage,
  updateTicketMessage,
  deleteTicketMessage,
} from "../services/apiClient";

function messageForError(err) {
  if (err?.status === 403) return "No tenés permiso para hacer esto en este ticket.";
  if (err?.status === 404) return "No encontramos el mensaje o el ticket.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos completar la acción. Intentá de nuevo.";
}

export function useTicketMessages(ticketId) {
  const [messages, setMessages] = useState([]);
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
      const data = await fetchTicketMessages(ticketId);
      if (context !== generation.current || current !== request.current) return;
      setLoadedId(ticketId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      if (context !== generation.current || current !== request.current) return;
      setLoadedId(ticketId);
      setMessages([]);
      setError(messageForError(err));
    } finally {
      if (context === generation.current && current === request.current) setLoading(false);
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

  const send = useCallback(
    async (visibility, text) => {
      const context = generation.current;
      const created = await createTicketMessage(ticketId, { visibility, text });
      if (context !== generation.current) return null;
      setMessages((prev) => [...prev.filter((item) => item.id !== created.id), created]);
      return created;
    },
    [ticketId]
  );

  const edit = useCallback(
    async (messageId, text) => {
      const context = generation.current;
      const updated = await updateTicketMessage(ticketId, messageId, { text });
      if (context !== generation.current) return null;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      return updated;
    },
    [ticketId]
  );

  const remove = useCallback(
    async (messageId) => {
      const context = generation.current;
      await deleteTicketMessage(ticketId, messageId);
      if (context !== generation.current) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [ticketId]
  );

  return { messages: loadedId === ticketId ? messages : [], loading: Boolean(ticketId) && (loadedId !== ticketId || loading), error: loadedId === ticketId ? error : null, reload: load, send, edit, remove, messageForError };
}
