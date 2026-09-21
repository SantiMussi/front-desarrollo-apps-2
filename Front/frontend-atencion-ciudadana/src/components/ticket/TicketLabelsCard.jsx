import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Tag, X } from "lucide-react";
import DetailCard from "../ui/DetailCard";
import { assignTicketLabels, createStaffLabel, fetchStaffLabels, removeTicketLabel } from "../../services/apiClient";

function labelErrorMessage(error, action) {
  if (error?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (error?.status === 403) {
    if (action === "create") return "No tenés permiso para crear etiquetas. Necesitás un rol autorizado por el servidor.";
    if (action === "assign") return "No tenés permiso para asignar etiquetas a este ticket.";
    return "No tenés permiso para consultar el catálogo de etiquetas.";
  }
  if (error?.status === 404) return action === "load" ? "No se encontró el catálogo de etiquetas." : "La etiqueta o el ticket ya no existe.";
  return error?.message || "No pudimos actualizar las etiquetas. Intentá de nuevo.";
}

function initialLabels(ticket) {
  const labels = ticket?.labels ?? ticket?.ticketLabels ?? ticket?.manualLabels ?? [];
  if (!Array.isArray(labels)) return [];
  return labels
    .map((entry) => entry?.label ?? entry)
    .filter((entry) => entry && typeof entry === "object" && entry.id);
}

export default function TicketLabelsCard({ ticket }) {
  const [catalog, setCatalog] = useState([]);
  const [assigned, setAssigned] = useState(() => initialLabels(ticket));
  const [labelQuery, setLabelQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchStaffLabels()
      .then((labels) => {
        if (!cancelled) setCatalog(Array.isArray(labels) ? labels : []);
      })
      .catch((loadError) => {
        if (!cancelled) setError(labelErrorMessage(loadError, "load"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const assignedIds = useMemo(() => new Set(assigned.map((label) => String(label.id))), [assigned]);
  const available = catalog.filter((label) => label.active !== false && !assignedIds.has(String(label.id)));
  const matchingLabels = useMemo(
    () => available.filter((label) => matchesLabel(label, labelQuery)).slice(0, 6),
    [available, labelQuery]
  );
  const exactMatch = matchingLabels.find((label) => normalizeLabel(label.name) === normalizeLabel(labelQuery));

  const assignLabel = async (label) => {
    if (!label || savingId) return;
    setSavingId(label.id);
    setError(null);
    try {
      await assignTicketLabels(ticket.id, [label.id]);
      setAssigned((current) => [...current, label]);
      setLabelQuery("");
    } catch (saveError) {
      setError(labelErrorMessage(saveError, "assign"));
    } finally {
      setSavingId(null);
    }
  };

  const createAndAssignLabel = async () => {
    const name = labelQuery.trim();
    if (!name || exactMatch || savingId) return;
    setSavingId("new");
    setError(null);
    try {
      const created = await createStaffLabel({ code: labelCode(name), name, description: null });
      const label = created?.label ?? created;
      if (!label?.id) throw new Error("La etiqueta se creó, pero no pudimos obtener su identificador.");
      await assignTicketLabels(ticket.id, [label.id]);
      setCatalog((current) => [...current, label]);
      setAssigned((current) => [...current, label]);
      setLabelQuery("");
    } catch (saveError) {
      setError(labelErrorMessage(saveError, "create"));
    } finally {
      setSavingId(null);
    }
  };

  const removeLabel = async (label) => {
    if (savingId) return;
    setSavingId(label.id);
    setError(null);
    try {
      await removeTicketLabel(ticket.id, label.id);
      setAssigned((current) => current.filter((item) => String(item.id) !== String(label.id)));
    } catch (saveError) {
      setError(labelErrorMessage(saveError, "remove"));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DetailCard title="Etiquetas" icon={Tag}>
      {loading ? (
        <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando etiquetas…
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {assigned.map((label) => (
              <span
                key={label.id}
                title={[label.code, label.description].filter(Boolean).join(" · ")}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pl-2.5 pr-1 text-[11px] font-semibold text-[#0F2C59]"
              >
                <span className="truncate">{label.name}</span>
                <button
                  type="button"
                  onClick={() => removeLabel(label)}
                  disabled={Boolean(savingId)}
                  aria-label={`Quitar etiqueta ${label.name}`}
                  className="rounded-full p-0.5 hover:bg-blue-100 disabled:opacity-40"
                >
                  {savingId === label.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </span>
            ))}
            {!assigned.length && <p className="text-xs text-slate-400">Este ticket no tiene etiquetas.</p>}
          </div>

          <div className="relative mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={labelQuery}
                onChange={(event) => setLabelQuery(event.target.value)}
                disabled={Boolean(savingId)}
                aria-label="Buscar o crear etiqueta"
                placeholder="Buscar o crear etiqueta…"
                className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/10 disabled:bg-slate-100"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (exactMatch) assignLabel(exactMatch);
                    else if (labelQuery.trim()) createAndAssignLabel();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => exactMatch ? assignLabel(exactMatch) : createAndAssignLabel()}
                disabled={!labelQuery.trim() || Boolean(savingId)}
                className="inline-flex items-center gap-1 rounded-md bg-[#0F2C59] px-3 py-2 text-xs font-semibold text-white hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {exactMatch ? "Asignar" : "Crear"}
              </button>
            </div>
            {labelQuery.trim() && matchingLabels.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Etiquetas disponibles</p>
                {matchingLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => assignLabel(label)}
                    className="block w-full px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            )}
            {labelQuery.trim() && !exactMatch && (
              <p className="mt-1 text-[10px] text-slate-500">No existe una coincidencia exacta. Podés crear “{labelQuery.trim()}”.</p>
            )}
          </div>
        </>
      )}
      {error && <p role="alert" className="mt-2 text-[11px] leading-4 text-red-600">{error}</p>}
    </DetailCard>
  );
}

function normalizeLabel(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function matchesLabel(label, query) {
  const normalizedQuery = normalizeLabel(query);
  const normalizedName = normalizeLabel(label.name);
  if (!normalizedQuery || !normalizedName) return false;
  if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) return true;
  const threshold = normalizedQuery.length < 5 ? 1 : Math.max(2, Math.floor(normalizedQuery.length * 0.35));
  return editDistance(normalizedQuery, normalizedName) <= threshold;
}

function labelCode(name) {
  const code = normalizeLabel(name).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").toUpperCase();
  return code || "LABEL";
}