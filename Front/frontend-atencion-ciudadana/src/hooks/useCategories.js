import { useState, useEffect } from "react";
import { MOCK_CATEGORIES } from "../data/mockCategories";
import { fetchCategories, fetchSubcategories, fetchRequestTypes } from "../services/apiClient";

const USE_MOCK = false;

// Helper para encontrar el ícono de la categoría
function getCategoryIcon(catName) {
  const match = MOCK_CATEGORIES.find(c => c.title.toLowerCase() === catName.toLowerCase());
  return match ? match.iconName : "Folder";
}

// Helper para encontrar el ícono de la subcategoría
function getSubcategoryIcon(subName) {
  for (const cat of MOCK_CATEGORIES) {
    const match = cat.subcategories.find(s => s.name.toLowerCase() === subName.toLowerCase());
    if (match) return match.iconName;
  }
  return "Folder";
}

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
          await new Promise((r) => setTimeout(r, 1000));
          if (!cancelled) {
            setCategories(MOCK_CATEGORIES);
          }
        } else {
          // Llamada real al backend
          const backendCats = await fetchCategories();

          const fullTree = await Promise.all(
            backendCats.map(async (cat) => {
              const backendSubs = await fetchSubcategories(cat.id);

              const subcategories = await Promise.all(
                backendSubs.map(async (sub) => {
                  const reqTypes = await fetchRequestTypes(sub.id);

                  const mappedReqTypes = reqTypes.map(rt => ({
                    ...rt,
                    code: rt.id.toString(),
                    specificFields: []
                  }));

                  return {
                    ...sub,
                    id: sub.id.toString(),
                    iconName: getSubcategoryIcon(sub.name),
                    requestTypes: mappedReqTypes
                  };
                })
              );

              return {
                ...cat,
                id: cat.id.toString(),
                title: cat.name,
                iconName: getCategoryIcon(cat.name),
                subcategories,
                itemCount: subcategories.reduce((acc, sub) => acc + sub.requestTypes.length, 0)
              };
            })
          );

          if (!cancelled) setCategories(fullTree);
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
