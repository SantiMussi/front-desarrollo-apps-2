import { useState, useEffect } from "react";
import { MOCK_CATEGORIES } from "../data/mockCategories";
import { fetchCategories } from "../services/apiClient";

// Vuelto a true a pedido del usuario porque el back no está listo
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
          if (!cancelled) {
            console.log("[useCategories] Respuesta esperada del backend GET /api/categories:", MOCK_CATEGORIES);
            setCategories(MOCK_CATEGORIES);
          }
        } else {
          // Llamada real al backend
          const data = await fetchCategories();
          if (!cancelled) setCategories(data);
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
