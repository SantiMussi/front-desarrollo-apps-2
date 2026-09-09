import { useEffect, useId, useState } from "react";
import { ArrowRight, LockKeyhole, MessageSquare, X } from "lucide-react";

const CONTROL_CLASS = "mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

export default function TicketTransitionDialog({
  open,
  eyebrow,
  title,
  description,
  fields = [],
  confirmation,
  confirmLabel = "Confirmar",
  commentLabel = "Comentario",
  commentOptional = true,
  publicCommentLabel = "Público",
  internalCommentLabel = "Interno",
  publicCommentPlaceholder = "Mensaje visible para el ciudadano…",
  internalCommentPlaceholder = "Nota visible solo para el equipo…",
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && onCancel();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px]" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D63031]">{eyebrow}</p>}
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </header>

        <div className="px-5 py-4">
          {!!fields.length && <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((field) => (
              <label key={field.id} className="col-span-2 text-xs font-semibold text-slate-700 sm:col-span-1">
                {field.label}
                <select
                  id={field.id}
                  value={field.value}
                  disabled={field.disabled}
                  onChange={(event) => field.onChange?.(event.target.value)}
                  className={`${CONTROL_CLASS} ${field.disabled ? "cursor-not-allowed bg-slate-100 text-slate-600" : ""}`}
                >
                  {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {field.helpText && <span className="mt-1 flex items-center gap-1 text-[10px] font-normal text-slate-500">{field.disabled && <LockKeyhole className="h-3 w-3" />}{field.helpText}</span>}
              </label>
            ))}
          </div>}

          <div className={`${fields.length ? "mt-4" : ""} overflow-hidden rounded-lg border border-slate-200`}>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><MessageSquare className="h-3.5 w-3.5" />{commentLabel}{commentOptional && <span className="font-normal text-slate-400">(opcional)</span>}</span>
              <div className="flex rounded-md border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
                <button type="button" onClick={() => setVisibility("PUBLIC")} className={`rounded px-2.5 py-1 ${visibility === "PUBLIC" ? "bg-[#0F2C59] text-white" : "text-slate-500"}`}>{publicCommentLabel}</button>
                <button type="button" onClick={() => setVisibility("INTERNAL")} className={`rounded px-2.5 py-1 ${visibility === "INTERNAL" ? "bg-amber-100 text-amber-900" : "text-slate-500"}`}>{internalCommentLabel}</button>
              </div>
            </div>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder={visibility === "PUBLIC" ? publicCommentPlaceholder : internalCommentPlaceholder} className="block w-full resize-none border-t border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:bg-blue-50/30" />
          </div>

          {confirmation && <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-950"><ArrowRight className="h-4 w-4 shrink-0" /><span>{confirmation}</span></div>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button type="button" disabled={!commentOptional && !comment.trim()} onClick={() => onConfirm({ comment: comment.trim(), visibility })} className="rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-50">{confirmLabel}</button>
        </footer>
      </section>
    </div>
  );
}