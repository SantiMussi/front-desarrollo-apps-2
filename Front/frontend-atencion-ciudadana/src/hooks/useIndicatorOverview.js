import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { fetchIndicatorOverview, getStoredToken } from "../services/apiClient";

export function useIndicatorOverview(filters = {}) {
  const { user, isAuthenticated } = useAuth();
  const allowed = isAuthenticated && ["AGENT", "ADMIN"].includes(user?.role);
  const contextKey = JSON.stringify([user?.citizenId, user?.id, user?.role, user?.responsibleAreaId, getStoredToken()]);
  const filterKey = JSON.stringify(filters);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const key = JSON.stringify([contextKey, filterKey, revision]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    fetchIndicatorOverview(JSON.parse(filterKey)).then(
      (data) => { if (!cancelled) setState({ key, data, error: null }); },
      (err) => { if (!cancelled) setState({ key, data: null, error: err?.status === 401
        ? "Tu sesión no es válida. Volvé a iniciar sesión." : err?.status === 403
          ? "No tenés permiso para consultar indicadores." : err?.message || "No pudimos cargar los indicadores." }); },
    );
    return () => { cancelled = true; };
  }, [allowed, key, filterKey]);

  const refetch = useCallback(() => setRevision((value) => value + 1), [setRevision]);
  const current = state.key === key && allowed;
  return { data: current ? state.data : null, loading: allowed && !current,
    error: !allowed ? "No tenés permiso para consultar indicadores." : current ? state.error : null, refetch };
}
