import { useEffect, useState } from "react";
import { fetchCategories, fetchSubcategories, fetchRequestTypes } from "../services/apiClient";

export function useRequestTypesCatalog() {
  const [requestTypes, setRequestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const categories = await fetchCategories();
        const nested = await Promise.all(
          categories.map(async (category) => {
            const subcategories = await fetchSubcategories(category.id);
            const subNested = await Promise.all(
              subcategories.map(async (subcategory) => {
                const types = await fetchRequestTypes(subcategory.id);
                return types.map((rt) => ({
                  id: rt.id,
                  code: rt.code,
                  name: rt.name,
                  categoryName: category.name,
                  subcategoryName: subcategory.name,
                }));
              })
            );
            return subNested.flat();
          })
        );
        if (!cancelled) setRequestTypes(nested.flat());
      } catch (err) {
        if (!cancelled) setError(err?.message ?? "No pudimos cargar el catálogo de tipos de solicitud.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { requestTypes, loading, error };
}
