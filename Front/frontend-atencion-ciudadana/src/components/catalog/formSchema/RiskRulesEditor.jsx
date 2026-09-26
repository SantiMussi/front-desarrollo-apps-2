import { useState } from "react";
import { Info, Plus, ShieldAlert, Trash2 } from "lucide-react";
import Toggle from "./Toggle";
import {
  MAX_INCREMENT,
  MIN_INCREMENT,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  emptyRule,
} from "./formSchemaModel";

const inputClass =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[13px] text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

function ValueInputs({ field, rule, onChange }) {
  const { type } = field;

  if (type === "BOOLEAN") {
    return (
      <select value={rule.expected} onChange={(e) => onChange({ expected: e.target.value })} className={inputClass} aria-label="Respuesta">
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (type === "SELECT" && rule.operator === "EQUALS") {
    const missing = rule.expected.startsWith("missing:");
    return (
      <select value={rule.expected} onChange={(e) => onChange({ expected: e.target.value })} className={inputClass} aria-label="Opción">
        <option value="">Elegí una opción…</option>
        {missing && <option value={rule.expected}>(opción eliminada)</option>}
        {field.options.map((option) => (
          <option key={option.uid} value={option.uid}>
            {option.label || "(sin texto)"}
          </option>
        ))}
      </select>
    );
  }

  if (type === "SELECT" && rule.operator === "IN") {
    const toggle = (uid) =>
      onChange({
        expectedList: rule.expectedList.includes(uid)
          ? rule.expectedList.filter((item) => item !== uid)
          : [...rule.expectedList, uid],
      });
    return (
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((option) => {
          const selected = rule.expectedList.includes(option.uid);
          return (
            <button
              key={option.uid}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(option.uid)}
              className={`rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${
                selected ? "border-[#0F2C59] bg-[#0F2C59] text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label || "(sin texto)"}
            </button>
          );
        })}
        {rule.expectedList.some((uid) => uid.startsWith("missing:")) && (
          <span className="text-[11.5px] text-red-600">Incluye opciones eliminadas</span>
        )}
      </div>
    );
  }

  // NUMBER
  switch (rule.operator) {
    case "EQUALS":
      return (
        <input type="number" value={rule.expected} onChange={(e) => onChange({ expected: e.target.value })} placeholder="Número" className={`${inputClass} w-28`} aria-label="Número" />
      );
    case "IN":
      return (
        <input value={rule.expected} onChange={(e) => onChange({ expected: e.target.value })} placeholder="1, 2, 3" className={`${inputClass} w-36`} aria-label="Números separados por coma" />
      );
    case "BETWEEN":
      return (
        <span className="inline-flex items-center gap-1.5">
          <input type="number" value={rule.valueFrom} onChange={(e) => onChange({ valueFrom: e.target.value })} placeholder="Desde" className={`${inputClass} w-24`} aria-label="Desde" />
          <span className="text-slate-500">y</span>
          <input type="number" value={rule.valueTo} onChange={(e) => onChange({ valueTo: e.target.value })} placeholder="Hasta" className={`${inputClass} w-24`} aria-label="Hasta" />
        </span>
      );
    case "GREATER_THAN":
      return (
        <input type="number" value={rule.valueFrom} onChange={(e) => onChange({ valueFrom: e.target.value })} placeholder="Número" className={`${inputClass} w-28`} aria-label="Mayor que" />
      );
    case "LESS_THAN":
      return (
        <input type="number" value={rule.valueTo} onChange={(e) => onChange({ valueTo: e.target.value })} placeholder="Número" className={`${inputClass} w-28`} aria-label="Menor que" />
      );
    default:
      return null;
  }
}

export default function RiskRulesEditor({ field, onChange, errors }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const rules = field.riskRules;
  const allowedOperators = OPERATORS_BY_TYPE[field.type] ?? [];

  const update = (uid, patch) => onChange(rules.map((rule) => (rule.uid === uid ? { ...rule, ...patch } : rule)));

  const changeOperator = (rule, operator) =>
    update(rule.uid, {
      operator,
      expected: field.type === "BOOLEAN" ? "true" : "",
      expectedList: [],
      valueFrom: "",
      valueTo: "",
    });

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          Reglas de riesgo <span className="font-normal text-slate-400">(opcional)</span>
        </p>
        <button
          type="button"
          onClick={() => setHelpOpen((value) => !value)}
          aria-expanded={helpOpen}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0F2C59] hover:underline"
        >
          <Info className="h-3.5 w-3.5" />
          ¿Cómo funcionan?
        </button>
      </div>

      {helpOpen && (
        <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] leading-relaxed text-blue-900">
          Cuando la respuesta del vecino coincide con una regla, se suman (o restan) puntos al riesgo del ticket. El
          puntaje parte del riesgo base del tipo de solicitud (Bajo 0, Medio 25, Alto 50, Crítico 75), se limita a 0–100
          y define la prioridad: menos de 25 Baja, 25–49 Media, 50–74 Alta, 75 o más Crítica. Dos reglas activas del
          mismo campo no pueden coincidir con la misma respuesta.
        </div>
      )}

      {!rules.length && (
        <p className="mt-2 text-[12px] text-slate-400">Este campo no modifica el riesgo del ticket.</p>
      )}

      <div className="mt-2 space-y-2">
        {rules.map((rule) => {
          const error = errors?.[rule.uid];
          const operators = allowedOperators.includes(rule.operator) ? allowedOperators : [...allowedOperators, rule.operator];
          return (
            <div
              key={rule.uid}
              className={`rounded-lg border p-2.5 ${error ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white"} ${
                rule.active ? "" : "opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Toggle checked={rule.active} onChange={(active) => update(rule.uid, { active })} label="Regla activa" />
                  <span className="text-[11.5px]">{rule.active ? "Activa" : "Pausada"}</span>
                </span>
                <span>Si la respuesta</span>
                {operators.length > 1 ? (
                  <select value={rule.operator} onChange={(e) => changeOperator(rule, e.target.value)} className={inputClass} aria-label="Condición">
                    {operators.map((operator) => (
                      <option key={operator} value={operator}>
                        {OPERATOR_LABELS[operator]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-slate-700">{OPERATOR_LABELS[rule.operator]}</span>
                )}
                <ValueInputs field={field} rule={rule} onChange={(patch) => update(rule.uid, patch)} />
                <span>→ sumar</span>
                <input
                  type="number"
                  min={MIN_INCREMENT}
                  max={MAX_INCREMENT}
                  value={rule.riskIncrement}
                  onChange={(e) => update(rule.uid, { riskIncrement: e.target.value })}
                  className={`${inputClass} w-20`}
                  aria-label="Puntos de riesgo"
                />
                <span>puntos</span>
                <button
                  type="button"
                  onClick={() => onChange(rules.filter((item) => item.uid !== rule.uid))}
                  aria-label="Quitar regla"
                  className="ml-auto rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange([...rules, emptyRule(field.type)])}
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F2C59] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar regla de riesgo
      </button>
    </div>
  );
}
