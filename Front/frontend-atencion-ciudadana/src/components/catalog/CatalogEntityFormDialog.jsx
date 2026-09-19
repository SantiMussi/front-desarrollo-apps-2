import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const CONTROL =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

function buildInitialState(fields, initialValues) {
  const state = {};
  fields.forEach((field) => {
    const raw = initialValues?.[field.name];
    state[field.name] = field.type === "boolean" ? Boolean(raw) : (raw ?? "");
  });
  return state;
}

function FieldControl({ field, value, onChange, disabled }) {
  if (field.locked) {
    return (
      <label className="block text-xs font-semibold text-slate-700">
        {field.label}
        <span className={`${CONTROL} block bg-slate-50 text-slate-500`}>{field.lockedLabel ?? value}</span>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block text-xs font-semibold text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={field.maxLength}
          disabled={disabled}
          placeholder={field.placeholder}
          className={`${CONTROL} resize-none`}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block text-xs font-semibold text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={CONTROL}>
          <option value="">Seleccionar…</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <label className="block text-xs font-semibold text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          disabled={disabled}
          className={CONTROL}
        />
        {field.hint && <span className="mt-1 block text-[11px] font-normal text-slate-400">{field.hint}</span>}
      </label>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5">
        <span className="text-xs font-semibold text-slate-700">{field.label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-300 text-[#0F2C59] focus:ring-[#0F2C59]"
        />
      </label>
    );
  }

  return (
    <label className="block text-xs font-semibold text-slate-700">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        disabled={disabled}
        className={CONTROL}
      />
    </label>
  );
}

export default function CatalogEntityFormDialog({
  title,
  subtitle,
  fields,
  initialValues,
  submitLabel = "Guardar",
  loading = false,
  error,
  onCancel,
  onSubmit,
}) {
  const titleId = useId();
  const [values, setValues] = useState(() => buildInitialState(fields, initialValues));

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [loading, onCancel]);

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const canSubmit = useMemo(() => {
    if (loading) return false;
    return fields.every((field) => {
      if (field.locked || !field.required || field.type === "boolean") return true;
      return String(values[field.name] ?? "").trim().length > 0;
    });
  }, [fields, values, loading]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {};
    fields.forEach((field) => {
      const raw = field.locked ? initialValues?.[field.name] : values[field.name];
      if (field.type === "number") payload[field.name] = raw === "" || raw === null || raw === undefined ? null : Number(raw);
      else if (field.type === "boolean") payload[field.name] = Boolean(raw);
      else if (typeof raw === "string") payload[field.name] = raw.trim() === "" && !field.required ? null : raw.trim();
      else payload[field.name] = raw;
    });
    onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[65vh] space-y-3.5 overflow-y-auto px-5 py-4">
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(v) => setField(field.name, v)}
              disabled={loading}
            />
          ))}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Guardando…" : submitLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
