import { useCallback, useEffect, useState } from "react";
import { fetchAgentTickets, fetchAreaTickets } from "../services/apiClient";

const EMPTY_PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0 };

export function useAgentTickets({ categoryId, priority, neighborhoodId, withoutLocation = false,
  responsibleAreaId, status, labelIds, search, page = 0, size = 20, sort = "createdAt,desc", areaScoped = false,
} = {}) {
  const [state, setState] = useState({ key: null, data: EMPTY_PAGE, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const key = JSON.stringify([categoryId, priority, neighborhoodId, withoutLocation, responsibleAreaId,
    status, labelIds, search, page, size, sort, areaScoped, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    const fetchPage = areaScoped ? fetchAreaTickets : fetchAgentTickets;
    fetchPage({ categoryId, priority, neighborhoodId, withoutLocation, responsibleAreaId,
      status, labelIds, search, page, size, sort }).then(
      (data) => { if (!cancelled) setState({ key, data: data ?? EMPTY_PAGE, error: null }); },
      (error) => { if (!cancelled) setState({ key, data: EMPTY_PAGE, error: error?.status === 401
        ? "Tu sesión no es válida. Volvé a iniciar sesión." : error?.status === 403
          ? "No tenés permiso para consultar estos tickets." : error?.message ?? "No pudimos cargar los tickets." }); },
    );
    return () => { cancelled = true; };
  }, [key, categoryId, priority, neighborhoodId, withoutLocation, responsibleAreaId, status, labelIds, search, page, size, sort, areaScoped]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  const current = state.key === key;
  const data = current ? state.data : EMPTY_PAGE;
  return { tickets: data.content ?? [], totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0, pageNumber: data.number ?? 0, loading: !current,
    error: current ? state.error : null, refetch };
}
