import { useEffect, useRef } from "react";
import { ArrowLeft, ClipboardCheck, Pencil, Send } from "lucide-react";
import Spinner from "../ui/Spinner";

// Paso final antes de crear el reclamo: muestra todo lo cargado y permite volver al campo exacto a corregir.
export default function TicketReviewSummary({ items, loading = false, notice = null, onEdit, onBack, onConfirm }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView?.({ block: "start" });
  }, []);

  return (
    <section aria-labelledby="ticket-review-title" className="space-y-5">
      {notice}
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0F2C59]">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 id="ticket-review-title" ref={headingRef} tabIndex={-1} className="text-[1.35rem] font-extrabold tracking-tight text-[#0F2C59] outline-none">
            Revisá tu reclamo antes de enviarlo
          </h3>
          <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
            Controlá que todo esté bien. Si algo no es correcto, tocá «Corregir» al lado del dato.
          </p>
        </div>
      </div>

      <dl className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-neutral-500">{item.label}</dt>
              <dd className="mt-1 space-y-0.5 text-[15px] leading-snug text-neutral-800">
                {item.lines.map((line, index) => (
                  <p key={`${item.id}-${index}`} className="break-words whitespace-pre-line">{line}</p>
                ))}
              </dd>
            </div>
            {item.target && (
              <button
                type="button"
                aria-label={`Corregir ${item.label}`}
                onClick={() => onEdit(item.target)}
                disabled={loading}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0F2C59] transition-colors hover:bg-blue-50 disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Corregir
              </button>
            )}
          </div>
        ))}
      </dl>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
        Una vez enviado, los datos no se pueden modificar. Si después querés agregar algo, podés hacerlo escribiendo al equipo desde el seguimiento.
      </p>

      <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-600 transition-all hover:bg-neutral-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver y corregir
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D63031] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#c0282a] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="border-white/30 border-t-white" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Confirmar y enviar
            </>
          )}
        </button>
      </div>
    </section>
  );
}
