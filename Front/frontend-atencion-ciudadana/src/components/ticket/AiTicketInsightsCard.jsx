import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { fetchTicketAiInsights } from "../../services/apiClient";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";

const URGENCY_LABELS = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };
const SIMILARITY_LABELS = { HIGH: "Muy parecido", MEDIUM: "Parecido", LOW: "Algo parecido" };

const formatDistance = (meters) => (meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`);

function errorMessage(err) {
  if (err?.status === 429) return "Hiciste muchas consultas seguidas. Probá de nuevo en unos minutos.";
  if (err?.status === 403) return "No tenés permiso para analizar este ticket.";
  return "No pudimos consultar la ayuda automática. Probá de nuevo más tarde.";
}

/**
 * Resumen, pista de urgencia y duplicados probables de un ticket para quien lo revisa. Es una ayuda:
 * la prioridad real la calcula el sistema y vincular un duplicado sigue siendo una acción del agente.
 * Se pide a mano porque cada análisis consume cuota del proveedor de IA.
 */
export default function AiTicketInsightsCard({ ticketId }) {
  const [state, setState] = useState({ status: "idle", data: null, error: null, ticketId: null });

  const run = async () => {
    if (state.status === "loading") return;
    setState({ status: "loading", data: null, error: null, ticketId });
    try {
      const data = await fetchTicketAiInsights(ticketId);
      setState({ status: "done", data, error: null, ticketId });
    } catch (err) {
      setState({ status: "error", data: null, error: errorMessage(err), ticketId });
    }
  };

  // Un resultado de otro ticket (al navegar entre tickets) no se muestra.
  const current = state.ticketId === ticketId ? state : { status: "idle", data: null, error: null };
  const { data } = current;
  const ai = data?.source === "AI";

  return (
    <section className="border-b border-slate-200 py-6" aria-labelledby="ai-insights-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ai-insights-title" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-[#0F2C59]" aria-hidden="true" />
          Ayuda con IA
        </h2>
        <button
          type="button"
          onClick={run}
          disabled={current.status === "loading"}
          className="inline-flex items-center gap-2 rounded-md border border-[#0F2C59]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F2C59] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {current.status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {data ? "Analizar de nuevo" : "Analizar ticket"}
        </button>
      </div>

      <div aria-live="polite" className="mt-3 space-y-3 text-sm text-slate-700">
        {current.status === "idle" && (
          <p className="text-xs text-slate-500">Resume el reclamo y sus mensajes, sugiere una urgencia y marca posibles duplicados. Es orientativo.</p>
        )}
        {current.error && <p className="text-xs text-red-600">{current.error}</p>}

        {data && !ai && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            La ayuda con IA no está disponible en este momento.
            {data.duplicates.length > 0 ? " Mostramos los tickets cercanos, sin analizar." : ""}
          </p>
        )}

        {ai && (
          <>
            <p className="leading-6">{data.summary}</p>
            {data.urgencyHint && (
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Urgencia sugerida: {URGENCY_LABELS[data.urgencyHint]}</span>
                {data.urgencyReason ? ` — ${data.urgencyReason}` : ""}
                <span className="ml-1 text-slate-400">(la prioridad real la calcula el sistema)</span>
              </p>
            )}
          </>
        )}

        {data && (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {ai ? "Posibles duplicados" : "Tickets cercanos"}
            </h3>
            {data.duplicates.length === 0 ? (
              <p className="text-xs text-slate-500">{ai ? "La IA no encontró duplicados probables." : "No hay tickets cercanos."}</p>
            ) : (
              <ul className="space-y-2">
                {data.duplicates.map((item) => (
                  <li key={item.ticketId} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/agente/tickets/${item.ticketId}`} className="font-semibold text-[#0F2C59] hover:underline">{item.publicId}</Link>
                      <span className="text-slate-400">{TICKET_STATUS_LABELS[item.currentStatus] || item.currentStatus}</span>
                      <span className="text-slate-400">· a {formatDistance(item.distanceMeters)}</span>
                      {item.similarity && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{SIMILARITY_LABELS[item.similarity]}</span>
                      )}
                    </div>
                    <p className="mt-1 text-slate-600">{item.summary}</p>
                    {item.reason && <p className="mt-0.5 text-slate-500">{item.reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
