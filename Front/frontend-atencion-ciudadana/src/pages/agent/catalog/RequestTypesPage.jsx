import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { fetchCategories, fetchSubcategories, fetchRequestTypes } from "../../../services/apiClient";
import CatalogBreadcrumb from "../../../components/catalog/CatalogBreadcrumb";
import CatalogEntityTable from "../../../components/catalog/CatalogEntityTable";
import CatalogCreateButton from "../../../components/catalog/CatalogCreateButton";
import CatalogStatusBadge from "../../../components/catalog/CatalogStatusBadge";

function messageForError(err) {
  if (err?.status === 404) {
    return "El back todavía no tiene el listado de tipos de solicitud — queda preparado para cuando esté listo.";
  }
  return err?.message || "No pudimos cargar los tipos de solicitud.";
}

export default function RequestTypesPage() {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [requestTypes, setRequestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [categories, subs, types] = await Promise.all([
          fetchCategories(),
          fetchSubcategories(categoryId),
          fetchRequestTypes(subcategoryId),
        ]);
        if (cancelled) return;
        setCategory(categories.find((c) => String(c.id) === String(categoryId)) || null);
        setSubcategory((Array.isArray(subs) ? subs : []).find((s) => String(s.id) === String(subcategoryId)) || null);
        setRequestTypes(Array.isArray(types) ? types : []);
      } catch (err) {
        if (!cancelled) setError(messageForError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, subcategoryId]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <CatalogBreadcrumb
        items={[
          { label: "Catálogo", to: "/agente/catalogo" },
          { label: category?.name || "Categoría", to: `/agente/catalogo/${categoryId}` },
          { label: subcategory?.name || "Subcategoría" },
        ]}
      />
      <button
        type="button"
        onClick={() => navigate(`/agente/catalogo/${categoryId}`)}
        className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0F2C59] hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a subcategorías
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <FileText className="h-5 w-5 text-[#0F2C59]" />
            Tipos de solicitud{subcategory?.name ? ` de ${subcategory.name}` : ""}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Tipos de solicitud disponibles dentro de esta subcategoría.</p>
        </div>
        <CatalogCreateButton
          label="Nuevo tipo de solicitud"
          disabledReason={
            subcategory && !subcategory.active
              ? "No se puede crear: la subcategoría está inactiva."
              : "Disponible en una próxima iteración."
          }
        />
      </div>

      <div className="mt-5">
        <CatalogEntityTable
          items={requestTypes}
          loading={loading}
          error={error}
          emptyMessage="Esta subcategoría todavía no tiene tipos de solicitud."
          columns={[
            { key: "name", label: "Nombre" },
            {
              key: "code",
              label: "Código",
              render: (rt) => <span className="font-mono text-[12px] text-slate-500">{rt.code}</span>,
            },
            { key: "description", label: "Descripción", render: (rt) => rt.description || "—" },
            { key: "active", label: "Estado", render: (rt) => <CatalogStatusBadge active={rt.active} /> },
          ]}
        />
      </div>
    </div>
  );
}
