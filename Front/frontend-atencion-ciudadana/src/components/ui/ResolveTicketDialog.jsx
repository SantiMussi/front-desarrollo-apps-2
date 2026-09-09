import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquare, Sparkles, X } from "lucide-react";
import { RESOLUTION_TYPES, SIMULATED_AREA_RESPONSES } from "../../constants/resolutionTypes";

const CONTROL =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100";

// Se monta solo cuando el diálogo está abierto (el padre hace `{open && <... />}`),
// así el estado del formulario se resetea naturalmente en cada apertura.
export default function ResolveTicketDialog({
  ticketPublicId,
  eligible = true,
  ineligibleReason,
  loading = false,
  error,
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const [type, setType] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [internalMessage, setInternalMessage] = useState("");
  const [simulatedId, setSimulatedId] = useState("");
  const [source, setSource] = useState("manual"); // "manual" | "simulator"

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [loading, onCancel]);

  const applySimulated = (id) => {
    setSimulatedId(id);
    const response = SIMULATED_AREA_RESPONSES.find((r) => r.id === id);
    if (!response) {
      setSource("manual");
      return;
    }
    setSource("simulator");
    setType(response.type);
    setPublicMessage(response.publicMessage);
    setInternalMessage(response.internalMessage ?? "");
  };

  const canConfirm = useMemo(
    () => eligible && !loading && Boolean(type) && publicMessage.trim().length > 0,
    [eligible, loading, type, publicMessage]
  );

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
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D63031]">
              Resolución · {ticketPublicId}
            </p>
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold text-slate-900">
              Marcar como resuelto
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Registrá el resultado de la solicitud. El ticket pasa a <strong>Resuelto</strong>.
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
          {!eligible ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">No se puede resolver manualmente</p>
                <p className="mt-0.5 text-[13px] leading-relaxed">
                  {ineligibleReason ||
                    "El ticket debe estar En gestión y ser gestionado por Atención Ciudadana (M2)."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Simulador */}
              <label className="block text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#0F2C59]" />
                  Simular respuesta del área responsable
                  <span className="font-normal text-slate-400">(opcional)</span>
                </span>
                <select
                  value={simulatedId}
                  onChange={(e) => applySimulated(e.target.value)}
                  className={CONTROL}
                >
                  <option value="">— Cargar la resolución manualmente —</option>
                  {SIMULATED_AREA_RESPONSES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {source === "simulator" && (
                  <span className="mt-1 block text-[11px] font-normal text-emerald-700">
                    Resultado simulado cargado. Podés ajustarlo antes de confirmar.
                  </span>
                )}
              </label>

              <div className="my-4 h-px bg-slate-100" />

              <label className="block text-xs font-semibold text-slate-700">
                Tipo de resultado <span className="text-[#D63031]">*</span>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setSource("manual");
                    setSimulatedId("");
                  }}
                  className={CONTROL}
                >
                  <option value="">Seleccionar…</option>
                  {RESOLUTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Mensaje para el ciudadano <span className="text-[#D63031]">*</span>
                </span>
                <textarea
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                  rows={3}
                  placeholder="Explicá brevemente el resultado de la solicitud…"
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
            </>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {eligible ? "Cancelar" : "Cerrar"}
          </button>
          {eligible && (
            <button
              type="button"
              onClick={() =>
                onConfirm({
                  type,
                  publicMessage: publicMessage.trim(),
                  internalMessage: internalMessage.trim(),
                  source,
                })
              }
              disabled={!canConfirm}
              className="inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Registrando…" : "Confirmar resolución"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
