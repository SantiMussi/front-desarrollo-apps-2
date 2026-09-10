import { useEffect, useState } from "react";
import { NEIGHBORHOODS } from "../data/mockCategories";
import { fetchNeighborhoods } from "../services/apiClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalize(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.neighborhoods)
        ? raw.neighborhoods
        : Array.isArray(raw?.content)
          ? raw.content
          : [];

  return arr
    .map((n) => ({
      id: String(n.id ?? n.value ?? n.code ?? ""),
      name: String(n.name ?? n.label ?? n.nombre ?? "").trim(),
    }))
    .filter((n) => n.id && n.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

const MOCK_LIST = normalize(NEIGHBORHOODS);

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState(MOCK_LIST);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("mock");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = normalize(await fetchNeighborhoods());
        const looksReal = list.length > 0 && list.every((n) => UUID_RE.test(n.id));
        if (cancelled) return;
        if (looksReal) {
          setNeighborhoods(list);
          setSource("backend");
        } else {
          setNeighborhoods(MOCK_LIST);
          setSource("mock");
        }
      } catch (err) {
        if (cancelled) return;
        setNeighborhoods(MOCK_LIST);
        setSource("mock");
        setError(err?.message ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { neighborhoods, loading, source, isRemote: source === "backend", error };
}
