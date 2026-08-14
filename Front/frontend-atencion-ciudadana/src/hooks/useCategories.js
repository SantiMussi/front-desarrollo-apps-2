import { useState, useEffect } from "react";
import { MOCK_CATEGORIES } from "../data/mockCategories";

// TODO: Reemplazar por fetchCategories() del apiClient cuando el backend esté listo
const USE_MOCK = true;

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 400));
          if (!cancelled) setCategories(MOCK_CATEGORIES);
        } else {
          // TODO: const data = await fetchCategories();
          // if (!cancelled) setCategories(data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error };
}
