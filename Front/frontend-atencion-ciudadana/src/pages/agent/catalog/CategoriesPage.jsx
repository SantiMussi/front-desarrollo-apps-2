import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { fetchCategories } from "../../../services/apiClient";
import CatalogBreadcrumb from "../../../components/catalog/CatalogBreadcrumb";
import CatalogEntityTable from "../../../components/catalog/CatalogEntityTable";
import CatalogCreateButton from "../../../components/catalog/CatalogCreateButton";
import CatalogStatusBadge from "../../../components/catalog/CatalogStatusBadge";

function messageForError(err) {
  if (err?.status === 404) {
    return "El back todavía no tiene el listado de categorías — queda preparado para cuando esté listo.";
  }
  return err?.message || "No pudimos cargar las categorías.";
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCategories();
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(messageForError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <CatalogBreadcrumb items={[{ label: "Catálogo" }]} />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Layers className="h-5 w-5 text-[#0F2C59]" />
            Categorías
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Elegí una categoría para ver sus subcategorías.</p>
        </div>
        <CatalogCreateButton label="Nueva categoría" disabledReason="Disponible en una próxima iteración." />
      </div>

      <div className="mt-5">
        <CatalogEntityTable
          items={categories}
          loading={loading}
          error={error}
          emptyMessage="Todavía no hay categorías cargadas."
          onRowClick={(cat) => navigate(`/agente/catalogo/${cat.id}`)}
          columns={[
            { key: "name", label: "Nombre" },
            { key: "description", label: "Descripción", render: (c) => c.description || "—" },
            { key: "active", label: "Estado", render: (c) => <CatalogStatusBadge active={c.active} /> },
          ]}
        />
      </div>
    </div>
  );
}
