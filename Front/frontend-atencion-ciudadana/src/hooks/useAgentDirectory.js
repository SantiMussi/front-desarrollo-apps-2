import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminAgents } from "../services/apiClient";

const count = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Math.trunc(Number(value)) : 0);
const text = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

/** Adapta una fila de GET /admin/agents; descarta filas sin identificador. */
export function normalizeAgent(raw) {
  if (!raw || !text(raw.actorId)) return null;
  const firstName = text(raw.firstName);
  const lastName = text(raw.lastName);
  const email = text(raw.email);
  const name = [firstName, lastName].filter(Boolean).join(" ") || email || "Sin nombre";
  const slaMet = count(raw.slaMet);
  const slaBreached = count(raw.slaBreached);
  const closed = slaMet + slaBreached;
  return {
    id: raw.actorId,
    name,
    email,
    role: text(raw.role),
    areaId: text(raw.areaId),
    active: raw.active === true,
    activeTickets: count(raw.activeTickets),
    resolvedThisMonth: count(raw.resolvedThisMonth),
    slaMet,
    slaBreached,
    // Sin ciclos cerrados no hay cumplimiento que mostrar: null en vez de un 0 % o 100 % engañoso.
    slaCompliance: closed > 0 ? Math.round((slaMet / closed) * 1000) / 10 : null,
  };
}

export function useAgentDirectory() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAgents();
      if (current !== request.current) return;
      setAgents((Array.isArray(data) ? data : []).map(normalizeAgent).filter(Boolean));
    } catch (err) {
      if (current !== request.current) return;
      setAgents([]);
      setError(err?.status === 403
        ? "Sólo un administrador puede ver el directorio del personal."
        : "No pudimos cargar el directorio del personal. Probá de nuevo en unos minutos.");
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
      request.current += 1;
    };
  }, [load]);

  return { agents, loading, error, reload: load };
}
