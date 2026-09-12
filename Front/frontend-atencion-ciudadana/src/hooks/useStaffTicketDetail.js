import { useCallback, useEffect, useState } from "react";
import { fetchStaffTicketDetail } from "../services/apiClient";

export function useStaffTicketDetail(ticketId) {
  const [ticket, setTicket] = useState(null);
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
      const data = await fetchStaffTicketDetail(ticketId);
      setTicket(data);
    } catch (err) {
      setTicket(null);
      setError(err);
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

  return { ticket, loading, error, reload: load };
}
