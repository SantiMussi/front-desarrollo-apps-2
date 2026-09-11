import { useCallback, useEffect, useState } from "react";
import { fetchAgentTickets } from "../services/apiClient";

const EMPTY_PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0 };

export function useAgentTickets({
  categoryId,
  priority,
  neighborhoodId,
  responsibleAreaId,
  status,
  page = 0,
  size = 20,
  sort = "createdAt,desc",
} = {}) {
  const [data, setData] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAgentTickets({
          categoryId,
          priority,
          neighborhoodId,
          responsibleAreaId,
          status,
          page,
          size,
          sort,
        });
        if (!cancelled) setData(res ?? EMPTY_PAGE);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "No pudimos cargar los tickets.");
          setData(EMPTY_PAGE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId, priority, neighborhoodId, responsibleAreaId, status, page, size, sort, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    tickets: data.content ?? [],
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
    pageNumber: data.number ?? 0,
    loading,
    error,
    refetch,
  };
}
