import { useId, useState } from "react";
import { Braces, Info, X } from "lucide-react";

const MOCK_SCHEMA = {
  fields: [
    {
      code: "detalle",
      label: "Detalle de la solicitud",
      type: "TEXTAREA",
      required: true,
      allowUnknown: false,
      displayOrder: 1,
      config: null,
      riskRules: [],
    },
  ],
};

export default function RequestTypeFormSchemaDialog({ requestType, onClose }) {
  const titleId = useId();
  const [text, setText] = useState(() => JSON.stringify(MOCK_SCHEMA, null, 2));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Braces className="h-4.5 w-4.5 text-[#0F2C59]" />
              Schema del formulario dinámico
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {requestType?.name} <span className="font-mono text-slate-400">({requestType?.code})</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-slate-700">
            Contenido del schema (JSON)
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              spellCheck={false}
              className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-slate-900 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-slate-100 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-[12px] text-blue-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Datos de ejemplo. La lectura y guardado real del schema contra el back (DDA2-132) y la validación
              detallada del JSON (DDA2-131) quedan preparadas para la próxima iteración.
            </span>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled
            title="Disponible cuando se integre la lectura y guardado real (DDA2-132)."
            className="inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar cambios
          </button>
        </footer>
      </section>
    </div>
  );
}
