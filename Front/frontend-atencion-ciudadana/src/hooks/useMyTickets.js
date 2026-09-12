import { useCallback, useEffect, useState } from "react";
import { fetchMyTickets } from "../services/apiClient";

// Datos de ejemplo mientras el back no expone GET /api/tickets/mine.
const SAMPLE_TICKETS = [
  {
    publicId: "OP-0000012345",
    currentStatus: "REGISTERED",
    summary: "Luminaria apagada en la cuadra",
    description:
      "Hace una semana que la luz de la calle no enciende, frente al número 123.",
    createdAt: "2026-10-10T12:00:00Z",
    statusChangedAt: "2026-10-10T12:00:00Z",
    requestType: { name: "Informar una luminaria apagada" },
    category: { name: "Alumbrado y equipamiento urbano" },
    subcategory: { name: "Alumbrado público" },
  },
  {
    publicId: "OP-0000012340",
    currentStatus: "IN_PROGRESS",
    summary: "Poda de árbol peligroso",
    description:
      "Las ramas están tocando los cables de tensión en la plaza principal.",
    createdAt: "2026-10-05T12:00:00Z",
    statusChangedAt: "2026-10-08T09:30:00Z",
    requestType: { name: "Solicitar poda" },
    category: { name: "Arbolado, plazas y espacios verdes" },
    subcategory: { name: "Arbolado público" },
  },
  {
    publicId: "OP-0000012298",
    currentStatus: "RESOLVED",
    summary: "Bache en Avenida Central",
    description:
      "Pozo profundo en el carril derecho antes de llegar al semáforo.",
    createdAt: "2026-09-20T12:00:00Z",
    statusChangedAt: "2026-09-29T16:00:00Z",
    requestType: { name: "Informar un bache" },
    category: { name: "Calles, veredas e infraestructura urbana" },
    subcategory: { name: "Calles y Pavimento" },
  },
];

function normalize(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.content)
      ? raw.content
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.tickets)
          ? raw.tickets
          : [];

  return arr.map((t) => ({
    publicId: String(t.publicId ?? t.id ?? ""),
    currentStatus: t.currentStatus ?? t.status ?? "REGISTERED",
    summary: t.summary ?? "",
    description: t.description ?? "",
    createdAt: t.createdAt ?? null,
    statusChangedAt: t.statusChangedAt ?? t.updatedAt ?? t.createdAt ?? null,
    requestType: t.requestType ?? (t.requestTypeName ? { name: t.requestTypeName } : null),
    category: t.category ?? (t.categoryName ? { name: t.categoryName } : null),
    subcategory: t.subcategory ?? (t.subcategoryName ? { name: t.subcategoryName } : null),
  }));
}

export function useMyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("sample");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = normalize(await fetchMyTickets({ size: 50, sort: "createdAt,desc" }));
      setTickets(list);
      setSource("backend");
    } catch (err) {
      setTickets(SAMPLE_TICKETS);
      setSource("sample");
      if (err?.status && ![401, 403, 404].includes(err.status)) {
        setError(err.message ?? "No pudimos cargar tus reclamos.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { tickets, loading, error, source, reload: load };
}
