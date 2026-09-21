import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Power, RefreshCw, Search, Tag, Tags, Trash2, X } from "lucide-react";
import { createStaffLabel, deleteStaffLabel, fetchStaffLabels, updateStaffLabel } from "../../services/apiClient";
import CatalogEntityFormDialog from "../../components/catalog/CatalogEntityFormDialog";

const CREATE_FIELDS = [
  {
    name: "code",
    label: "Código",
    type: "text",
    required: true,
    maxLength: 60,
    placeholder: "Ej.: URGENTE",
  },
  {
    name: "name",
    label: "Nombre",
    type: "text",
    required: true,
    maxLength: 120,
    placeholder: "Ej.: Requiere atención urgente",
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    required: true,
    maxLength: 300,
    placeholder: "Explicá cuándo debe usarse esta etiqueta.",
  },
];

const EDIT_FIELDS = [
  { name: "code", label: "Código", type: "text", locked: true },
  {
    name: "name",
    label: "Nombre",
    type: "text",
    required: true,
    maxLength: 120,
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    required: true,
    maxLength: 300,
  },
];

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function usageCount(label) {
  return Number(
    label.ticketCount
  );
}

const errorMessage = (error) => {
  if (error?.status === 401)
    return "Tu sesión venció. Volvé a ingresar para continuar.";
  if (error?.status === 403)
    return "No tenés permisos para administrar etiquetas.";
  if (error?.status === 409)
    return error.message || "Ya existe una etiqueta con ese código o nombre.";
  return (
    error?.message || "No pudimos completar la operación. Intentá nuevamente."
  );
};

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    gray: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span
        className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xl font-bold leading-none text-slate-800">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function DeleteDialog({ label, loading, error, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !loading && onCancel()
      }
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-label-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start gap-3 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2
                id="delete-label-title"
                className="text-base font-semibold text-slate-900"
              >
                Eliminar etiqueta
              </h2>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                aria-label="Cerrar"
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vas a eliminar{" "}
              <strong className="text-slate-800">{label.name}</strong>. Esta
              acción no se puede deshacer.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Si solo querés ocultarla para usos futuros, te recomendamos
              desactivarla.
            </p>
          </div>
        </div>
        {error && (
          <div className="mx-5 mb-4 flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Eliminar
            definitivamente
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function LabelsPage() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialog, setDialog] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaffLabels();
      setLabels(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err));
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

  const counts = useMemo(
    () => ({
      total: labels.length,
      active: labels.filter((label) => label.active).length,
      inactive: labels.filter((label) => !label.active).length,
    }),
    [labels],
  );

  const visibleLabels = useMemo(() => {
    const term = normalize(query.trim());
    return labels.filter((label) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" ? label.active : !label.active);
      const matchesQuery =
        !term ||
        [label.name, label.code, label.description].some((value) =>
          normalize(value).includes(term),
        );
      return matchesFilter && matchesQuery;
    });
  }, [filter, labels, query]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (dialog.mode === "create") await createStaffLabel(payload);
      else
        await updateStaffLabel(dialog.label.id, {
          ...payload,
          active: dialog.label.active,
        });
      setDialog(null);
      await load();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = async (label) => {
    setBusyId(label.id);
    setActionError(null);
    try {
      const updated = await updateStaffLabel(label.id, {
        name: label.name,
        description: label.description,
        active: !label.active,
      });
      setLabels((current) =>
        current.map((item) =>
          item.id === label.id
            ? updated || { ...item, active: !item.active }
            : item,
        ),
      );
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const label = dialog.label;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await deleteStaffLabel(label.id);
      setLabels((current) => current.filter((item) => item.id !== label.id));
      setDialog(null);
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70">
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F2C59]">
              <Tags className="h-4 w-4" />
              Administración
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Etiquetas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Organizá las etiquetas que el equipo utiliza para clasificar y
              encontrar tickets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setDialog({ mode: "create" });
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#173d73]"
          >
            <Plus className="h-4 w-4" />
            Nueva etiqueta
          </button>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Etiquetas totales"
            value={counts.total}
            icon={Tags}
            tone="blue"
          />
          <StatCard
            label="Activas"
            value={counts.active}
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            label="Inactivas"
            value={counts.inactive}
            icon={Power}
            tone="gray"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, código o descripción…"
                aria-label="Buscar etiquetas"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filtrar por estado"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0F2C59]"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                title="Actualizar"
                aria-label="Actualizar etiquetas"
                className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {actionError && (
            <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-[#0F2C59]" />
            </div>
          ) : error ? (
            <div className="m-4 flex flex-col items-center rounded-lg border border-red-100 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
              <AlertCircle className="mb-2 h-6 w-6" />
              <p>{error}</p>
              <button onClick={load} className="mt-3 font-semibold underline">
                Reintentar
              </button>
            </div>
          ) : visibleLabels.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                <Tag className="h-6 w-6" />
              </span>
              <p className="font-semibold text-slate-700">
                {labels.length
                  ? "No encontramos coincidencias"
                  : "Todavía no hay etiquetas"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {labels.length
                  ? "Probá con otra búsqueda o filtro."
                  : "Creá la primera etiqueta para empezar a organizar tickets."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Etiqueta</th>
                    <th className="px-5 py-3 font-semibold">Código</th>
                    <th className="px-5 py-3 font-semibold">Descripción</th>
                    <th className="px-5 py-3 font-semibold">Tickets</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleLabels.map((label) => (
                    <tr
                      key={label.id}
                      className={
                        !label.active
                          ? "bg-slate-50/60"
                          : "hover:bg-slate-50/50"
                      }
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${label.active ? "bg-blue-50 text-[#0F2C59]" : "bg-slate-100 text-slate-400"}`}
                          >
                            <Tag className="h-4 w-4" />
                          </span>
                          <span className="font-semibold text-slate-800">
                            {label.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {label.code}
                        </code>
                      </td>
                      <td className="max-w-sm px-5 py-4 text-slate-500">
                        <span className="line-clamp-2">
                          {label.description || "Sin descripción"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0F2C59]">
                          {usageCount(label)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${label.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {label.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSubmitError(null);
                              setDialog({ mode: "edit", label });
                            }}
                            title="Editar"
                            aria-label={`Editar ${label.name}`}
                            className="rounded-md p-2 text-slate-400 hover:bg-blue-50 hover:text-[#0F2C59]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleLabel(label)}
                            disabled={busyId === label.id}
                            title={label.active ? "Desactivar" : "Activar"}
                            aria-label={`${label.active ? "Desactivar" : "Activar"} ${label.name}`}
                            className={`rounded-md p-2 ${label.active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100 hover:text-[#0F2C59]"}`}
                          >
                            {busyId === label.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSubmitError(null);
                              setDialog({ mode: "delete", label });
                            }}
                            title="Eliminar"
                            aria-label={`Eliminar ${label.name}`}
                            className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && labels.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              Mostrando {visibleLabels.length} de {labels.length} etiquetas
            </div>
          )}
        </section>
      </div>

      {dialog?.mode === "create" && (
        <CatalogEntityFormDialog
          title="Nueva etiqueta"
          subtitle="El código será permanente y debe ser único."
          fields={CREATE_FIELDS}
          submitLabel="Crear etiqueta"
          loading={submitting}
          error={submitError}
          onCancel={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}
      {dialog?.mode === "edit" && (
        <CatalogEntityFormDialog
          title="Editar etiqueta"
          subtitle="El código no puede modificarse."
          fields={EDIT_FIELDS}
          initialValues={dialog.label}
          submitLabel="Guardar cambios"
          loading={submitting}
          error={submitError}
          onCancel={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}
      {dialog?.mode === "delete" && (
        <DeleteDialog
          label={dialog.label}
          loading={submitting}
          error={submitError}
          onCancel={() => setDialog(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
