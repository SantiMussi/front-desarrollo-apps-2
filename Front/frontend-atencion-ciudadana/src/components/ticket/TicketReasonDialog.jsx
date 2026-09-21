import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquare, Tag, X } from "lucide-react";
import Select from "../ui/Select";

const CONTROL =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

export default function TicketReasonDialog({
  ticketPublicId,
  eyebrow,
  title,
  description,
  reasonLabel = "Motivo",
  reasonPlaceholder = "Ej.: AREA_NOT_RESPONSIBLE",
  reasonOptions,
  confirmLabel = "Confirmar",
  danger = false,
  loading = false,
  error,
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const [reasonCode, setReasonCode] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [internalMessage, setInternalMessage] = useState("");

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [loading, onCancel]);

  const canConfirm = useMemo(
    () =>
      !loading &&
      reasonCode.trim().length > 0 &&
      (publicMessage.trim().length > 0 || internalMessage.trim().length > 0),
    [loading, reasonCode, publicMessage, internalMessage]
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
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${danger ? "text-[#D63031]" : "text-[#0F2C59]"}`}>
              {eyebrow} · {ticketPublicId}
            </p>
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
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
              <Tag className="h-3.5 w-3.5" />
              {reasonLabel} <span className="text-[#D63031]">*</span>
            </span>
            {reasonOptions ? (
              <Select
                size="sm"
                className="mt-1.5"
                value={reasonCode}
                onChange={(nextValue) => setReasonCode(nextValue)}
                placeholder="Seleccioná un motivo…"
                options={reasonOptions}
              />
            ) : (
              <input
                type="text"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                placeholder={reasonPlaceholder}
                className={CONTROL}
              />
            )}
          </label>

          <label className="mt-3 block text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Mensaje para el ciudadano <span className="font-normal text-slate-400">(uno de los dos es obligatorio)</span>
            </span>
            <textarea
              value={publicMessage}
              onChange={(e) => setPublicMessage(e.target.value)}
              rows={3}
              placeholder="Explicá brevemente el motivo…"
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
                reasonCode: reasonCode.trim(),
                publicMessage: publicMessage.trim(),
                internalMessage: internalMessage.trim(),
              })
            }
            disabled={!canConfirm}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
              danger ? "bg-[#D63031] hover:bg-[#c0282a]" : "bg-[#0F2C59] hover:bg-[#173d73]"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? "Enviando…" : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
