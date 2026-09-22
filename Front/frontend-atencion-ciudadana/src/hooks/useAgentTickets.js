import { useCallback, useEffect, useState } from "react";
import { fetchAgentTickets, fetchTicketsByLabel } from "../services/apiClient";

const EMPTY_PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0 };

export function useAgentTickets({
  categoryId,
  priority,
  neighborhoodId,
  responsibleAreaId,
  status,
  labelId,
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
        const pagination = { page, size, sort };
        const filters = {
          categoryId,
          priority,
          neighborhoodId,
          responsibleAreaId,
          status,
        };
        const res = labelId
          ? await fetchTicketsByLabel(labelId, { ...filters, ...pagination })
          : await fetchAgentTickets({
              ...filters,
              ...pagination,
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
  }, [categoryId, priority, neighborhoodId, responsibleAreaId, status, labelId, page, size, sort, reloadKey]);

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
