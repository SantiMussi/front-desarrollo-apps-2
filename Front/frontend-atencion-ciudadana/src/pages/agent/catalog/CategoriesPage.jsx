import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Layers } from "lucide-react";
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  activateCategory,
  deactivateCategory,
} from "../../../services/apiClient";
import { messageForCatalogError } from "../../../utils/catalogErrors";
import CatalogBreadcrumb from "../../../components/catalog/CatalogBreadcrumb";
import CatalogEntityTable from "../../../components/catalog/CatalogEntityTable";
import CatalogCreateButton from "../../../components/catalog/CatalogCreateButton";
import CatalogStatusBadge from "../../../components/catalog/CatalogStatusBadge";
import CatalogRowActions from "../../../components/catalog/CatalogRowActions";
import CatalogEntityFormDialog from "../../../components/catalog/CatalogEntityFormDialog";

const FORM_FIELDS = [
  { name: "name", label: "Nombre", type: "text", required: true, maxLength: 150 },
  { name: "description", label: "Descripción", type: "textarea", required: true },
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
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
      const data = await fetchAdminCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(messageForCatalogError(err));
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

  const handleCreate = () => {
    setSubmitError(null);
    setDialog({ mode: "create" });
  };

  const handleEdit = (category) => {
    setSubmitError(null);
    setDialog({ mode: "edit", target: category });
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (dialog.mode === "create") await createCategory(payload);
      else await updateCategory(dialog.target.id, payload);
      setDialog(null);
      await load();
    } catch (err) {
      setSubmitError(messageForCatalogError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category) => {
    setToggleError(null);
    setTogglingId(category.id);
    try {
      const updated = category.active ? await deactivateCategory(category.id) : await activateCategory(category.id);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setToggleError(messageForCatalogError(err));
    } finally {
      setTogglingId(null);
    }
  };

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
        <CatalogCreateButton label="Nueva categoría" onClick={handleCreate} />
      </div>

      {toggleError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toggleError}
        </div>
      )}

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
            {
              key: "actions",
              label: "",
              render: (c) => (
                <CatalogRowActions
                  active={c.active}
                  busy={togglingId === c.id}
                  onEdit={() => handleEdit(c)}
                  onToggleActive={() => handleToggleActive(c)}
                />
              ),
            },
          ]}
        />
      </div>

      {dialog && (
        <CatalogEntityFormDialog
          title={dialog.mode === "create" ? "Nueva categoría" : "Editar categoría"}
          fields={FORM_FIELDS}
          initialValues={dialog.target}
          submitLabel={dialog.mode === "create" ? "Crear categoría" : "Guardar cambios"}
          loading={submitting}
          error={submitError}
          onCancel={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
