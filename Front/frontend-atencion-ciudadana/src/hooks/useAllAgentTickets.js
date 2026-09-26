import { useCallback, useEffect, useState } from "react";
import { fetchAgentTickets } from "../services/apiClient";

const PAGE_SIZE = 200;

export function useAllAgentTickets({ sort = "createdAt,desc" } = {}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const firstPage = await fetchAgentTickets({ page: 0, size: PAGE_SIZE, sort });
        const totalPages = Number(firstPage?.totalPages) || 1;
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
            fetchAgentTickets({ page: index + 1, size: PAGE_SIZE, sort })
          )
        );
        const allTickets = [firstPage, ...remainingPages].flatMap((page) => page?.content ?? []);

        if (!cancelled) setTickets(allTickets);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "No pudimos cargar todos los tickets.");
          setTickets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sort, reloadKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return { tickets, loading, error, refetch };
}