import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquare, X } from "lucide-react";

const CONTROL =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

export default function RequestInformationDialog({ ticketPublicId, loading = false, error, onCancel, onConfirm }) {
  const titleId = useId();
  const [messageForCitizen, setMessageForCitizen] = useState("");
  const [internalMessage, setInternalMessage] = useState("");

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [loading, onCancel]);

  const canConfirm = useMemo(
    () => !loading && messageForCitizen.trim().length > 0,
    [loading, messageForCitizen]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D63031]">
              Solicitud de información · {ticketPublicId}
            </p>
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold text-slate-900">
              Solicitar información al ciudadano
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              El ticket pasa a <strong>Pendiente de información</strong> hasta que el ciudadano responda.
            </p>
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

        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Mensaje para el ciudadano <span className="text-[#D63031]">*</span>
            </span>
            <textarea
              value={messageForCitizen}
              onChange={(e) => setMessageForCitizen(e.target.value)}
              rows={3}
              placeholder="Explicá qué información necesitás para continuar…"
              className={`${CONTROL} resize-none`}
            />
          </label>

          <label className="mt-3 block text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Nota interna <span className="font-normal text-slate-400">(opcional)</span>
            </span>
            <textarea
              value={internalMessage}
              onChange={(e) => setInternalMessage(e.target.value)}
              rows={2}
              placeholder="Visible solo para el equipo…"
              className={`${CONTROL} resize-none`}
            />
          </label>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
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
            onClick={() =>
              onConfirm({
                messageForCitizen: messageForCitizen.trim(),
                internalMessage: internalMessage.trim(),
              })
            }
            disabled={!canConfirm}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? "Enviando…" : "Solicitar información"}
          </button>
        </footer>
      </section>
    </div>
  );
}
