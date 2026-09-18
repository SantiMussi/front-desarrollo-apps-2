import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { fetchCategories, fetchSubcategories } from "../../../services/apiClient";
import CatalogBreadcrumb from "../../../components/catalog/CatalogBreadcrumb";
import CatalogEntityTable from "../../../components/catalog/CatalogEntityTable";
import CatalogCreateButton from "../../../components/catalog/CatalogCreateButton";
import CatalogStatusBadge from "../../../components/catalog/CatalogStatusBadge";

function messageForError(err) {
  if (err?.status === 404) {
    return "El back todavía no tiene el listado de subcategorías — queda preparado para cuando esté listo.";
  }
  return err?.message || "No pudimos cargar las subcategorías.";
}

export default function SubcategoriesPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [categories, subs] = await Promise.all([fetchCategories(), fetchSubcategories(categoryId)]);
        if (cancelled) return;
        setCategory(categories.find((c) => String(c.id) === String(categoryId)) || null);
        setSubcategories(Array.isArray(subs) ? subs : []);
      } catch (err) {
        if (!cancelled) setError(messageForError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <CatalogBreadcrumb
        items={[{ label: "Catálogo", to: "/agente/catalogo" }, { label: category?.name || "Categoría" }]}
      />
      <button
        type="button"
        onClick={() => navigate("/agente/catalogo")}
        className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0F2C59] hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a categorías
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <FolderOpen className="h-5 w-5 text-[#0F2C59]" />
            Subcategorías{category?.name ? ` de ${category.name}` : ""}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Elegí una subcategoría para ver sus tipos de solicitud.</p>
        </div>
        <CatalogCreateButton
          label="Nueva subcategoría"
          disabledReason={
            category && !category.active
              ? "No se puede crear: la categoría está inactiva."
              : "Disponible en una próxima iteración."
          }
        />
      </div>

      <div className="mt-5">
        <CatalogEntityTable
          items={subcategories}
          loading={loading}
          error={error}
          emptyMessage="Esta categoría todavía no tiene subcategorías."
          onRowClick={(sub) => navigate(`/agente/catalogo/${categoryId}/${sub.id}`)}
          columns={[
            { key: "name", label: "Nombre" },
            { key: "description", label: "Descripción", render: (s) => s.description || "—" },
            { key: "active", label: "Estado", render: (s) => <CatalogStatusBadge active={s.active} /> },
          ]}
        />
      </div>
    </div>
  );
}
