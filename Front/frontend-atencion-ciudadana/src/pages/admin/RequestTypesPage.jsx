import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Braces, FileText } from "lucide-react";
import {
  fetchAdminSubcategories,
  fetchAdminRequestTypes,
  createRequestType,
  updateRequestType,
  activateRequestType,
  deactivateRequestType,
} from "../../services/apiClient";
import { messageForCatalogError } from "../../utils/catalogErrors";
import { RESPONSIBLE_AREAS } from "../../constants/responsibleAreas";
import CatalogBreadcrumb from "../../components/catalog/CatalogBreadcrumb";
import CatalogEntityTable from "../../components/catalog/CatalogEntityTable";
import CatalogCreateButton from "../../components/catalog/CatalogCreateButton";
import CatalogStatusBadge from "../../components/catalog/CatalogStatusBadge";
import CatalogRowActions from "../../components/catalog/CatalogRowActions";
import CatalogEntityFormDialog from "../../components/catalog/CatalogEntityFormDialog";
import RequestTypeFormSchemaDialog from "../../components/catalog/RequestTypeFormSchemaDialog";
import CatalogDependencyNotice from "../../components/catalog/CatalogDependencyNotice";

const TICKET_TYPE_OPTIONS = [
  { value: "COMPLAINT", label: "Reclamo" },
  { value: "REQUEST", label: "Solicitud" },
  { value: "INQUIRY", label: "Consulta" },
  { value: "SUGGESTION", label: "Sugerencia" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" },
];

const AREA_OPTIONS = Object.entries(RESPONSIBLE_AREAS).map(([value, label]) => ({ value, label: `${value} · ${label}` }));

export default function RequestTypesPage() {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();
  const [subcategory, setSubcategory] = useState(null);
  const [requestTypes, setRequestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toggleError, setToggleError] = useState(null);
  const [schemaDialogTarget, setSchemaDialogTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, types] = await Promise.all([
        fetchAdminSubcategories(categoryId),
        fetchAdminRequestTypes(subcategoryId),
      ]);
      setSubcategory((Array.isArray(subs) ? subs : []).find((s) => String(s.id) === String(subcategoryId)) || null);
      setRequestTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      setError(messageForCatalogError(err));
    } finally {
      setLoading(false);
    }
  }, [categoryId, subcategoryId]);

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
      { name: "subcategoryId", label: "Subcategoría", locked: true, lockedLabel: subcategory?.name || `#${subcategoryId}` },
      { name: "code", label: "Código", type: "text", required: true, maxLength: 100 },
      { name: "name", label: "Nombre", type: "text", required: true, maxLength: 200 },
      { name: "description", label: "Descripción", type: "textarea", required: true },
      { name: "ticketType", label: "Tipo de ticket", type: "select", required: true, options: TICKET_TYPE_OPTIONS },
      { name: "responsibleAreaId", label: "Área responsable", type: "select", required: true, options: AREA_OPTIONS },
      { name: "minimumPriority", label: "Prioridad mínima", type: "select", required: true, options: PRIORITY_OPTIONS },
      { name: "baseRisk", label: "Riesgo base", type: "select", required: true, options: PRIORITY_OPTIONS },
      {
        name: "affectedPopulationFactor",
        label: "Factor de población afectada",
        type: "number",
        required: true,
        min: 0,
        max: 1,
        step: 0.01,
        hint: "Proporción de 0 a 1 de la población del barrio que podría verse afectada.",
      },
      { name: "allowsAnonymous", label: "Permite creación anónima", type: "boolean" },
      { name: "requiresLocation", label: "Requiere ubicación", type: "boolean" },
    ],
    [subcategory, subcategoryId]
  );

  const handleCreate = () => {
    setSubmitError(null);
    setDialog({
      mode: "create",
      initialValues: {
        subcategoryId: Number(subcategoryId),
        code: "",
        name: "",
        description: "",
        ticketType: "",
        responsibleAreaId: "",
        minimumPriority: "",
        baseRisk: "",
        affectedPopulationFactor: "",
        allowsAnonymous: false,
        requiresLocation: false,
      },
    });
  };

  const handleEdit = (requestType) => {
    setSubmitError(null);
    setDialog({ mode: "edit", target: requestType, initialValues: requestType });
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (dialog.mode === "create") await createRequestType(payload);
      else await updateRequestType(dialog.target.id, payload);
      setDialog(null);
      await load();
    } catch (err) {
      setSubmitError(messageForCatalogError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (requestType) => {
    if (!requestType.active && subcategory && !subcategory.active) {
      setToggleError(`No se puede activar “${requestType.name}” mientras la subcategoría “${subcategory.name}” esté inactiva.`);
      return;
    }
    setToggleError(null);
    setTogglingId(requestType.id);
    try {
      const updated = requestType.active
        ? await deactivateRequestType(requestType.id)
        : await activateRequestType(requestType.id);
      setRequestTypes((prev) => prev.map((rt) => (rt.id === updated.id ? updated : rt)));
    } catch (err) {
      setToggleError(messageForCatalogError(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl px-5 py-8">
      <CatalogBreadcrumb
        items={[
          { label: "Catálogo", to: "/agente/catalogo" },
          { label: subcategory?.categoryName || "Categoría", to: `/agente/catalogo/${categoryId}` },
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
          onClick={handleCreate}
          disabled={Boolean(subcategory) && !subcategory.active}
          disabledReason="No se puede crear: la subcategoría está inactiva."
        />
      </div>

      {toggleError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toggleError}
        </div>
      )}

      <div className="mt-5">
        {subcategory && !subcategory.active && (
          <div className="mb-3">
            <CatalogDependencyNotice tone="warning">
              La subcategoría “{subcategory.name}” está inactiva. No podés crear, editar ni activar tipos de solicitud hasta reactivarla.
            </CatalogDependencyNotice>
          </div>
        )}
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
            {
              key: "schema",
              label: "",
              render: (rt) => (
                <button
                  type="button"
                  onClick={() => setSchemaDialogTarget(rt)}
                  title="Editar schema del formulario"
                  className="inline-flex items-center gap-1.5 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F2C59]"
                >
                  <Braces className="h-4 w-4" />
                </button>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (rt) => (
                <CatalogRowActions
                  active={rt.active}
                  busy={togglingId === rt.id}
                  onEdit={() => handleEdit(rt)}
                  onToggleActive={() => handleToggleActive(rt)}
                  editDisabled={Boolean(subcategory) && !subcategory.active}
                  editDisabledReason="No se puede editar: la subcategoría está inactiva."
                  toggleDisabled={!rt.active && Boolean(subcategory) && !subcategory.active}
                  toggleDisabledReason="Activá primero la subcategoría."
                />
              ),
            },
          ]}
        />
      </div>

      {dialog && (
        <CatalogEntityFormDialog
          title={dialog.mode === "create" ? "Nuevo tipo de solicitud" : "Editar tipo de solicitud"}
          fields={fields}
          initialValues={dialog.initialValues}
          submitLabel={dialog.mode === "create" ? "Crear tipo de solicitud" : "Guardar cambios"}
          loading={submitting}
          error={submitError}
          onCancel={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}

      {schemaDialogTarget && (
        <RequestTypeFormSchemaDialog
          requestType={schemaDialogTarget}
          onClose={() => setSchemaDialogTarget(null)}
        />
      )}
    </div>
    </div>
  );
}
