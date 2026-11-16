import { useState } from "react";
import { ArrowDown, ArrowUp, ListPlus, Plus, Trash2 } from "lucide-react";
import { emptyOption, newUid, slugifyOptionValue } from "./formSchemaModel";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

export default function OptionsEditor({ options, onChange, error }) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const update = (uid, patch) => onChange(options.map((option) => (option.uid === uid ? { ...option, ...patch } : option)));

  const setLabel = (option, label) =>
    update(option.uid, { label, ...(option.valueTouched ? {} : { value: slugifyOptionValue(label) }) });

  const setValue = (option, value) => update(option.uid, { value, valueTouched: true });

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const applyBulk = () => {
    const created = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ uid: newUid(), label, value: slugifyOptionValue(label), valueTouched: false }));
    if (!created.length) return;
    const kept = options.filter((option) => option.label.trim() || option.value.trim());
    onChange([...kept, ...created]);
    setBulkText("");
    setBulkOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">Opciones de la lista</p>
        <button
          type="button"
          onClick={() => setBulkOpen((value) => !value)}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0F2C59] hover:underline"
        >
          <ListPlus className="h-3.5 w-3.5" />
          Agregar varias a la vez
        </button>
      </div>

      {bulkOpen && (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <label className="block text-[11.5px] font-medium text-slate-600">
            Una opción por línea
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={4}
              placeholder={"Una\nEntre 2 y 5\nMás de 5"}
              className={`${inputClass} mt-1 resize-y`}
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setBulkOpen(false)} className="text-[12px] font-semibold text-slate-500 hover:underline">
              Cancelar
            </button>
            <button
              type="button"
              onClick={applyBulk}
              disabled={!bulkText.trim()}
              className="rounded-md bg-[#0F2C59] px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 space-y-1.5">
        <div className="hidden grid-cols-[1fr_1fr_auto] gap-2 px-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Texto que ve el vecino</span>
          <span>Valor que se guarda</span>
          <span className="w-[76px]" />
        </div>
        {options.map((option, index) => (
          <div key={option.uid} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={option.label}
              onChange={(e) => setLabel(option, e.target.value)}
              placeholder={`Opción ${index + 1}`}
              aria-label={`Texto de la opción ${index + 1}`}
              className={inputClass}
            />
            <input
              value={option.value}
              onChange={(e) => setValue(option, e.target.value)}
              placeholder="VALOR"
              aria-label={`Valor de la opción ${index + 1}`}
              className={`${inputClass} font-mono text-[12px]`}
            />
            <div className="flex items-center justify-end gap-0.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Subir opción"
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === options.length - 1}
                aria-label="Bajar opción"
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(options.filter((o) => o.uid !== option.uid))}
                aria-label="Quitar opción"
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...options, emptyOption()])}
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F2C59] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar opción
      </button>
      {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
