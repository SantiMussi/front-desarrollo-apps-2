import { useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, ShieldAlert, Trash2, Type } from "lucide-react";
import Toggle from "./Toggle";
import { TYPE_ICONS } from "./typeIcons";
import OptionsEditor from "./OptionsEditor";
import RiskRulesEditor from "./RiskRulesEditor";
import {
  FIELD_TYPES,
  FIELD_TYPE_BY_VALUE,
  MAX_CODE,
  MAX_LABEL,
  emptyOption,
  slugifyCode,
} from "./formSchemaModel";

const inputClass =
  "w-full rounded-md border bg-white px-2.5 py-2 text-[13px] text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

export default function FieldCard({ field, index, total, open, errors, onToggleOpen, onChange, onMove, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const meta = FIELD_TYPE_BY_VALUE[field.type];
  const Icon = TYPE_ICONS[field.type] ?? Type;
  const hasErrors = Boolean(errors);
  const activeRules = field.riskRules.filter((rule) => rule.active).length;

  const changeLabel = (label) => onChange({ label, ...(field.codeTouched ? {} : { code: slugifyCode(label) }) });

  const changeType = (type) => {
    if (type === field.type) return;
    const hasContent = field.riskRules.length > 0 || field.options.some((option) => option.label.trim());
    if (
      hasContent &&
      !window.confirm("Al cambiar el tipo se pierden las opciones y las reglas de riesgo de este campo. ¿Continuar?")
    ) {
      return;
    }
    onChange({
      type,
      options: type === "SELECT" ? [emptyOption(), emptyOption()] : [],
      riskRules: [],
      ...(FIELD_TYPE_BY_VALUE[type].placeholder ? {} : { placeholder: "" }),
    });
  };

  return (
    <article
      id={`field-${field.uid}`}
      className={`rounded-xl border bg-white shadow-sm ${hasErrors ? "border-red-300" : "border-slate-200"}`}
    >
      <header className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[#0F2C59]">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-slate-800">
              {index + 1}. {field.label.trim() || <span className="font-normal italic text-slate-400">Campo sin pregunta</span>}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span>{meta?.label}</span>
              {field.code && <span className="font-mono text-slate-400">{field.code}</span>}
              {field.required && <span className="rounded bg-slate-100 px-1.5 py-px font-medium text-slate-600">Obligatorio</span>}
              {activeRules > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-px font-medium text-amber-700">
                  <ShieldAlert className="h-3 w-3" />
                  {activeRules} {activeRules === 1 ? "regla" : "reglas"}
                </span>
              )}
              {hasErrors && (
                <span className="inline-flex items-center gap-1 font-medium text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  Revisar
                </span>
              )}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Subir campo"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Bajar campo"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          {confirmRemove ? (
            <span className="ml-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold">
              <button type="button" onClick={onRemove} className="text-red-600 hover:underline">
                Eliminar
              </button>
              <button type="button" onClick={() => setConfirmRemove(false)} className="text-slate-500 hover:underline">
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              aria-label="Eliminar campo"
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700 md:col-span-2">
              Pregunta que ve el vecino
              <input
                value={field.label}
                onChange={(e) => changeLabel(e.target.value)}
                maxLength={MAX_LABEL}
                placeholder="Ej.: ¿Cuántas luminarias están afectadas?"
                className={`${inputClass} mt-1 ${errors?.label ? "border-red-400" : "border-slate-300"}`}
              />
              {errors?.label && <span className="mt-1 block text-[12px] font-normal text-red-600">{errors.label}</span>}
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Tipo de campo
              <select
                value={field.type}
                onChange={(e) => changeType(e.target.value)}
                className={`${inputClass} mt-1 border-slate-300`}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11.5px] font-normal text-slate-500">{meta?.description}</span>
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Código interno
              <input
                value={field.code}
                onChange={(e) => onChange({ code: e.target.value, codeTouched: true })}
                maxLength={MAX_CODE}
                placeholder="cantidadLuminarias"
                spellCheck={false}
                className={`${inputClass} mt-1 font-mono text-[12.5px] ${errors?.code ? "border-red-400" : "border-slate-300"}`}
              />
              {errors?.code ? (
                <span className="mt-1 block text-[12px] font-normal text-red-600">{errors.code}</span>
              ) : (
                <span className="mt-1 block text-[11.5px] font-normal text-slate-500">
                  Identifica la respuesta en el ticket (no lo ve el vecino). Se genera solo desde la pregunta.
                </span>
              )}
            </label>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className="inline-flex items-center gap-2 text-[12.5px] text-slate-700">
              <Toggle checked={field.required} onChange={(required) => onChange({ required })} label="Campo obligatorio" />
              Campo obligatorio
            </label>
            <label className="inline-flex items-center gap-2 text-[12.5px] text-slate-700">
              <Toggle
                checked={field.allowUnknown}
                onChange={(allowUnknown) => onChange({ allowUnknown })}
                label="Permitir No sé / Prefiero no responder"
              />
              Permitir “No sé / Prefiero no responder”
            </label>
          </div>

          {meta?.placeholder && (
            <label className="block text-xs font-semibold text-slate-700">
              {field.type === "SELECT" ? "Texto del selector vacío" : "Texto de ayuda dentro del campo"}{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
              <input
                value={field.placeholder}
                onChange={(e) => onChange({ placeholder: e.target.value })}
                placeholder={field.type === "SELECT" ? "Seleccionar…" : "Ej.: esquina, plaza o cuadra"}
                className={`${inputClass} mt-1 border-slate-300`}
              />
            </label>
          )}

          {field.type === "SELECT" && (
            <OptionsEditor options={field.options} onChange={(options) => onChange({ options })} error={errors?.options} />
          )}

          <div className="border-t border-slate-100 pt-4">
            {meta?.risk ? (
              <RiskRulesEditor field={field} onChange={(riskRules) => onChange({ riskRules })} errors={errors?.rules} />
            ) : (
              <p className="flex items-start gap-1.5 text-[12px] text-slate-400">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Los campos de {meta?.label.toLowerCase()} no pueden influir en el riesgo del ticket (solo Sí/No, lista de
                opciones y número).
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
