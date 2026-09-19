import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, FolderOpen } from "lucide-react";
import {
  fetchAdminCategories,
  fetchAdminSubcategories,
  createSubcategory,
  updateSubcategory,
  activateSubcategory,
  deactivateSubcategory,
} from "../../../services/apiClient";
import { messageForCatalogError } from "../../../utils/catalogErrors";
import CatalogBreadcrumb from "../../../components/catalog/CatalogBreadcrumb";
import CatalogEntityTable from "../../../components/catalog/CatalogEntityTable";
import CatalogCreateButton from "../../../components/catalog/CatalogCreateButton";
import CatalogStatusBadge from "../../../components/catalog/CatalogStatusBadge";
import CatalogRowActions from "../../../components/catalog/CatalogRowActions";
import CatalogEntityFormDialog from "../../../components/catalog/CatalogEntityFormDialog";

export default function SubcategoriesPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toggleError, setToggleError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categories, subs] = await Promise.all([fetchAdminCategories(), fetchAdminSubcategories(categoryId)]);
      setCategory(categories.find((c) => String(c.id) === String(categoryId)) || null);
      setSubcategories(Array.isArray(subs) ? subs : []);
    } catch (err) {
      setError(messageForCatalogError(err));
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const fields = useMemo(
    () => [
      { name: "categoryId", label: "Categoría", locked: true, lockedLabel: category?.name || `#${categoryId}` },
      { name: "name", label: "Nombre", type: "text", required: true, maxLength: 150 },
      { name: "description", label: "Descripción", type: "textarea", required: false },
    ],
    [category, categoryId]
  );

  const handleCreate = () => {
    setSubmitError(null);
    setDialog({ mode: "create", initialValues: { categoryId: Number(categoryId), name: "", description: "" } });
  };

  const handleEdit = (subcategory) => {
    setSubmitError(null);
    setDialog({ mode: "edit", target: subcategory, initialValues: subcategory });
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (dialog.mode === "create") await createSubcategory(payload);
      else await updateSubcategory(dialog.target.id, payload);
      setDialog(null);
      await load();
    } catch (err) {
      setSubmitError(messageForCatalogError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (subcategory) => {
    setToggleError(null);
    setTogglingId(subcategory.id);
    try {
      const updated = subcategory.active
        ? await deactivateSubcategory(subcategory.id)
        : await activateSubcategory(subcategory.id);
      setSubcategories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setToggleError(messageForCatalogError(err));
    } finally {
      setTogglingId(null);
    }
  };

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
          onClick={handleCreate}
          disabled={Boolean(category) && !category.active}
          disabledReason="No se puede crear: la categoría está inactiva."
        />
      </div>

      {toggleError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toggleError}
        </div>
      )}

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
            {
              key: "actions",
              label: "",
              render: (s) => (
                <CatalogRowActions
                  active={s.active}
                  busy={togglingId === s.id}
                  onEdit={() => handleEdit(s)}
                  onToggleActive={() => handleToggleActive(s)}
                />
              ),
            },
          ]}
        />
      </div>

      {dialog && (
        <CatalogEntityFormDialog
          title={dialog.mode === "create" ? "Nueva subcategoría" : "Editar subcategoría"}
          fields={fields}
          initialValues={dialog.initialValues}
          submitLabel={dialog.mode === "create" ? "Crear subcategoría" : "Guardar cambios"}
          loading={submitting}
          error={submitError}
          onCancel={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
