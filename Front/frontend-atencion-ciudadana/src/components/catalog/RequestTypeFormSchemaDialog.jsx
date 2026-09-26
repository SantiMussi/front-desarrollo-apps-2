import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { AlertCircle, Braces, CheckCircle2, Code2, Loader2, Plus, X } from "lucide-react";
import { fetchAdminRequestTypeForm, saveAdminRequestTypeForm } from "../../services/apiClient";
import { messageForCatalogError } from "../../utils/catalogErrors";
import FieldCard from "./formSchema/FieldCard";
import { TYPE_ICONS } from "./formSchema/typeIcons";
import {
  FIELD_TYPES,
  emptyField,
  fieldsFromApi,
  fieldsToApi,
  snapshot,
  validateFields,
} from "./formSchema/formSchemaModel";

const NO_FORM_MESSAGE = /formulario configurado/i;

function TypePicker({ onPick }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-600">¿Qué tipo de campo querés agregar?</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FIELD_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type.value];
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onPick(type.value)}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-[#0F2C59] hover:bg-blue-50/40"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[#0F2C59]">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-slate-800">{type.label}</span>
                <span className="block text-[11.5px] leading-snug text-slate-500">{type.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RequestTypeFormSchemaDialog({ requestType, onClose }) {
  const titleId = useId();
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [version, setVersion] = useState(null);
  const [fields, setFields] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [openIds, setOpenIds] = useState(() => new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedInfo, setSavedInfo] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);

  const hydrate = useCallback((response) => {
    const loaded = fieldsFromApi(response);
    setFields(loaded);
    setInitialSnapshot(snapshot(loaded));
    setVersion(response?.version ?? null);
    setOpenIds(new Set(loaded.length <= 3 ? loaded.map((field) => field.uid) : []));
    setPickerOpen(loaded.length === 0);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchAdminRequestTypeForm(requestType.id);
        if (!cancelled) hydrate(response);
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 404 && NO_FORM_MESSAGE.test(err?.message || "")) {
          hydrate(null);
        } else {
          setLoadError(messageForCatalogError(err));
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestType.id, reloadToken, hydrate]);

  const validation = useMemo(() => validateFields(fields), [fields]);
  const dirty = status === "ready" && snapshot(fields) !== initialSnapshot;
  const payloadJson = useMemo(
    () => JSON.stringify(fieldsToApi(fields), (key, value) => (typeof value === "number" && Number.isNaN(value) ? null : value), 2),
    [fields]
  );

  const requestClose = useCallback(() => {
    if (saving) return;
    if (dirty) setDiscardPrompt(true);
    else onClose();
  }, [dirty, saving, onClose]);

  useEffect(() => {
    const onEsc = (event) => event.key === "Escape" && requestClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [requestClose]);

  const updateField = (uid, patch) => {
    setSavedInfo(null);
    setFields((current) => current.map((field) => (field.uid === uid ? { ...field, ...patch } : field)));
  };

  const moveField = (index, delta) => {
    const target = index + delta;
    setSavedInfo(null);
    setFields((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeField = (uid) => {
    setSavedInfo(null);
    setFields((current) => current.filter((field) => field.uid !== uid));
  };

  const addField = (type) => {
    const created = emptyField(type);
    setSavedInfo(null);
    setFields((current) => [...current, created]);
    setOpenIds((current) => new Set(current).add(created.uid));
    setPickerOpen(false);
    window.setTimeout(() => {
      document.getElementById(`field-${created.uid}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const toggleOpen = (uid) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const handleSave = async () => {
    setAttempted(true);
    setSavedInfo(null);
    setSaveError(null);
    if (validation.count > 0) {
      setOpenIds((current) => new Set([...current, ...Object.keys(validation.byField)]));
      return;
    }
    setSaving(true);
    try {
      const response = await saveAdminRequestTypeForm(requestType.id, fieldsToApi(fields));
      hydrate(response);
      setAttempted(false);
      setSavedInfo(
        `Formulario guardado: ahora está en la versión ${response?.version ?? "nueva"}. Los tickets ya creados conservan la versión anterior.`
      );
    } catch (err) {
      setSaveError(messageForCatalogError(err));
    } finally {
      setSaving(false);
    }
  };

  const showErrors = attempted && validation.count > 0;
  const nextVersion = (version ?? 0) + 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Braces className="h-[18px] w-[18px] text-[#0F2C59]" />
              Formulario dinámico
              {version != null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Versión {version}
                </span>
              )}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {requestType?.name} <span className="font-mono text-slate-400">({requestType?.code})</span>
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4">
          {status === "loading" && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0F2C59]" />
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus("loading");
                  setReloadToken((token) => token + 1);
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reintentar
              </button>
            </div>
          )}

          {status === "ready" && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-slate-500">
                Armá las preguntas que completa el vecino al iniciar este trámite. Cada guardado crea una versión nueva:
                los tickets ya creados siguen con la versión con la que se cargaron.
              </p>

              {savedInfo && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{savedInfo}</span>
                </div>
              )}

              {saveError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>El servidor rechazó el formulario:</strong> {saveError}
                  </span>
                </div>
              )}

              {showErrors && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Corregí {validation.count} {validation.count === 1 ? "cosa" : "cosas"} antes de guardar
                  </p>
                  {validation.form.length > 0 && (
                    <ul className="ml-6 mt-1 list-disc text-[12.5px]">
                      {validation.form.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                  {Object.keys(validation.byField).length > 0 && (
                    <p className="ml-6 mt-1 text-[12.5px]">Los campos con problemas están marcados en rojo.</p>
                  )}
                </div>
              )}

              {fields.map((field, index) => (
                <FieldCard
                  key={field.uid}
                  field={field}
                  index={index}
                  total={fields.length}
                  open={openIds.has(field.uid)}
                  errors={attempted ? validation.byField[field.uid] : undefined}
                  onToggleOpen={() => toggleOpen(field.uid)}
                  onChange={(patch) => updateField(field.uid, patch)}
                  onMove={(delta) => moveField(index, delta)}
                  onRemove={() => removeField(field.uid)}
                />
              ))}

              {pickerOpen ? (
                <TypePicker onPick={addField} />
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0F2C59] hover:border-[#0F2C59] hover:bg-blue-50/40"
                >
                  <Plus className="h-4 w-4" />
                  Agregar campo
                </button>
              )}

              {fields.length === 0 && !pickerOpen && (
                <p className="text-[12.5px] text-slate-400">Todavía no hay preguntas en este formulario.</p>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowJson((value) => !value)}
                  aria-expanded={showJson}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-[#0F2C59]"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showJson ? "Ocultar" : "Ver"} JSON que se envía al servidor
                </button>
                {showJson && (
                  <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-900 p-3 font-mono text-[11.5px] leading-relaxed text-slate-100">
                    {payloadJson}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-3">
          {discardPrompt ? (
            <>
              <p className="text-[12.5px] font-medium text-amber-700">Tenés cambios sin guardar. ¿Los descartás?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscardPrompt(false)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Seguir editando
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Descartar y cerrar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] text-slate-500">
                {status === "ready" && (
                  <>
                    {fields.length} {fields.length === 1 ? "campo" : "campos"}
                    {dirty ? (
                      <span className="font-semibold text-amber-700"> · Cambios sin guardar (se creará la versión {nextVersion})</span>
                    ) : null}
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={requestClose}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={status !== "ready" || saving || !dirty}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Guardando…" : "Guardar formulario"}
                </button>
              </div>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}
