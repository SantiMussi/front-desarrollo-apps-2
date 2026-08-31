import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";

const TRANSITIONS = {
  REGISTERED: [
    { status: "IN_REVIEW", action: "Empezar análisis" },
    { status: "DUPLICATE", action: "Marcar como duplicado" },
    { status: "CANCELLED", action: "Cancelar ticket" },
  ],
  IN_REVIEW: [
    { status: "PENDING_INFORMATION", action: "Solicitar información extra" },
    { status: "IN_PROGRESS", action: "Iniciar trabajo interno" },
    { status: "ROUTED", action: "Derivar al área correspondiente" },
    { status: "DUPLICATE", action: "Marcar como duplicado" },
    { status: "REGISTERED", action: "Descartar análisis" },
  ],
  PENDING_INFORMATION: [
    { status: "IN_REVIEW", action: "Continuar análisis" },
    { status: "IN_PROGRESS", action: "Continuar gestión" },
    { status: "CANCELLED", action: "Cancelar ticket" },
  ],
  ROUTED: [
    { status: "IN_PROGRESS", action: "Iniciar trabajo del área" },
    { status: "IN_REVIEW", action: "Devolver al agente" },
    { status: "PENDING_INFORMATION", action: "Solicitar información extra" },
    { status: "RESOLVED", action: "Marcar caso como resuelto" },
    { status: "CANCELLED", action: "Rechazar o cancelar solicitud" },
  ],
  IN_PROGRESS: [
    { status: "RESOLVED", action: "Completar solicitud" },
    { status: "PENDING_INFORMATION", action: "Solicitar información extra" },
    { status: "ROUTED", action: "Devolver al área asignadora" },
    { status: "CANCELLED", action: "Cancelar ticket" },
  ],
  RESOLVED: [
    { status: "CLOSED", action: "Validar resolución y cerrar" },
    { status: "IN_PROGRESS", action: "Reabrir ticket" },
  ],
  DUPLICATE: [
    { status: "IN_REVIEW", action: "Volver a revisar" },
    { status: "CLOSED", action: "Cerrar con el caso principal" },
  ],
  CANCELLED: [{ status: "IN_PROGRESS", action: "Reabrir solicitud" }],
  CLOSED: [],
};

const STATUS_TONES = {
  REGISTERED: "border-slate-300 bg-slate-100 text-slate-700",
  IN_REVIEW: "border-blue-300 bg-blue-100 text-blue-900",
  ROUTED: "border-blue-300 bg-blue-100 text-blue-900",
  IN_PROGRESS: "border-blue-300 bg-blue-100 text-blue-900",
  PENDING_INFORMATION: "border-amber-300 bg-amber-100 text-amber-900",
  DUPLICATE: "border-slate-300 bg-slate-100 text-slate-700",
  RESOLVED: "border-emerald-300 bg-emerald-100 text-emerald-900",
  CLOSED: "border-emerald-300 bg-emerald-100 text-emerald-900",
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-700",
};

export default function StatusTransitionMenu({ status, onChange, align = "right" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const transitions = TRANSITIONS[status] || [];

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectTransition = (nextStatus) => {
    onChange?.(nextStatus);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-flex items-stretch">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        disabled={!transitions.length}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default ${STATUS_TONES[status] || STATUS_TONES.REGISTERED}`}
      >
        {TICKET_STATUS_LABELS[status] || status}
        {!!transitions.length && <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && (
        <div id={menuId} role="menu" className={`absolute top-[calc(100%+8px)] z-30 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-xl ${align === "left" ? "left-0" : "right-0"}`}>
          <p className="px-4 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cambiar estado</p>
          {transitions.map((transition) => (
            <button
              type="button"
              role="menuitem"
              key={`${status}-${transition.status}`}
              onClick={() => selectTransition(transition.status)}
              className="group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{transition.action}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5" />
              <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${STATUS_TONES[transition.status]}`}>
                {TICKET_STATUS_LABELS[transition.status]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}