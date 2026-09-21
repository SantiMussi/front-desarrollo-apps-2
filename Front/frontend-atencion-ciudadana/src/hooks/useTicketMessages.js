import { useCallback, useEffect, useState } from "react";
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
      const data = await fetchTicketMessages(ticketId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
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

  const send = useCallback(
    async (visibility, text) => {
      const created = await createTicketMessage(ticketId, { visibility, text });
      setMessages((prev) => [...prev, created]);
      return created;
    },
    [ticketId]
  );

  const edit = useCallback(
    async (messageId, text) => {
      const updated = await updateTicketMessage(ticketId, messageId, { text });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      return updated;
    },
    [ticketId]
  );

  const remove = useCallback(
    async (messageId) => {
      await deleteTicketMessage(ticketId, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [ticketId]
  );

  return { messages, loading, error, reload: load, send, edit, remove, messageForError };
}
