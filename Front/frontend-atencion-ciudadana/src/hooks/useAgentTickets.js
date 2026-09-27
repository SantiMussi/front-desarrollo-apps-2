import { useCallback, useEffect, useState } from "react";
import { fetchAgentTickets } from "../services/apiClient";
import { hasTicketLocation } from "../utils/ticketLocation";

const EMPTY_PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0 };
const LOCATION_FILTER_PAGE_SIZE = 200;

export function useAgentTickets({
  categoryId,
  priority,
  neighborhoodId,
  withoutLocation = false,
  responsibleAreaId,
  status,
  labelIds,
  search,
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
        const requestParams = {
          categoryId,
          priority,
          neighborhoodId,
          responsibleAreaId,
          status,
          labelIds,
          search,
          sort,
        };
        let res;
        if (withoutLocation) {
          const firstPage = await fetchAgentTickets({ ...requestParams, page: 0, size: LOCATION_FILTER_PAGE_SIZE });
          const remainingPages = await Promise.all(
            Array.from({ length: Math.max(0, (Number(firstPage?.totalPages) || 1) - 1) }, (_, index) =>
              fetchAgentTickets({ ...requestParams, page: index + 1, size: LOCATION_FILTER_PAGE_SIZE })
            )
          );
          const matchingTickets = [firstPage, ...remainingPages]
            .flatMap((responsePage) => responsePage?.content ?? [])
            .filter((ticket) => !hasTicketLocation(ticket));
          res = {
            content: matchingTickets.slice(page * size, (page + 1) * size),
            totalElements: matchingTickets.length,
            totalPages: Math.ceil(matchingTickets.length / size),
            number: page,
          };
        } else {
          res = await fetchAgentTickets({ ...requestParams, page, size });
        }
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
  }, [categoryId, priority, neighborhoodId, withoutLocation, responsibleAreaId, status, labelIds, search, page, size, sort, reloadKey]);

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
