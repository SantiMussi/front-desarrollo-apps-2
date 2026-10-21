import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStaffTicketDetail } from "../services/apiClient";

export function useStaffTicketDetail(ticketId) {
  const [ticket, setTicket] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const generation = useRef(0);
  const request = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ background = false } = {}) => {
    const current = ++request.current;
    const context = generation.current;
    if (!ticketId) {
      setLoading(false);
      return;
    }
    if (!background) setLoading(true);
    setError(null);
    try {
      const data = await fetchStaffTicketDetail(ticketId);
      if (current !== request.current || context !== generation.current) return;
      setLoadedId(ticketId);
      setTicket(data);
    } catch (err) {
      if (current !== request.current || context !== generation.current) return;
      setLoadedId(ticketId);
      setTicket(null);
      setError(err);
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

  return { ticket: loadedId === ticketId ? ticket : null, loading: Boolean(ticketId) && (loadedId !== ticketId || loading), error: loadedId === ticketId ? error : null, reload: load };
}
