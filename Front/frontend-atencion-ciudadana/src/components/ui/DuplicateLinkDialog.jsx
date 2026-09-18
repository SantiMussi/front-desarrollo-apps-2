import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Link2, Loader2, Search, X } from "lucide-react";
import { fetchAgentTickets } from "../../services/apiClient";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";
import { rankDuplicateCandidates } from "../../utils/duplicateLink";

const CANDIDATE_POOL_SIZE = 100;
const SUGGESTED_LIMIT = 5;

const formatDate = (value) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function matchesQuery(candidate, query) {
  if (!query) return true;
  const haystack = `${candidate.publicId ?? ""} ${candidate.summary ?? ""} ${candidate.requestTypeName ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function CandidateRow({ candidate, matchReasons, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(candidate)}
      aria-pressed={selected}
      className={`flex w-full flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition ${
        selected ? "border-[#0F2C59] bg-blue-50/60 ring-1 ring-[#0F2C59]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-900">{candidate.publicId}</span>
        <span className="text-[10px] font-medium text-slate-400">{TICKET_STATUS_LABELS[candidate.currentStatus] || candidate.currentStatus}</span>
      </div>
      <p className="line-clamp-1 text-xs text-slate-600">{candidate.summary}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
        <span>{candidate.requestTypeName || "Sin tipo"}</span>
        {candidate.neighborhoodName && <span>· {candidate.neighborhoodName}</span>}
        <span>· {formatDate(candidate.createdAt)}</span>
      </div>
      {matchReasons?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {matchReasons.map((reason) => (
            <span key={reason} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {reason}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function DuplicateLinkDialog({ ticket, loading = false, error, onCancel, onConfirm }) {
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCandidatesLoading(true);
      setCandidatesError(null);
      try {
        const res = await fetchAgentTickets({ size: CANDIDATE_POOL_SIZE, sort: "createdAt,desc" });
        if (!cancelled) setCandidates(res?.content ?? []);
      } catch {
        if (!cancelled) setCandidatesError("No pudimos cargar los tickets para sugerir duplicados.");
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticket.id]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [loading, onCancel]);

  const ranked = useMemo(() => rankDuplicateCandidates(ticket, candidates), [ticket, candidates]);

  const suggested = useMemo(
    () => ranked.filter((entry) => entry.matchReasons.length > 0).slice(0, SUGGESTED_LIMIT),
    [ranked]
  );

  const searchResults = useMemo(() => {
    const suggestedIds = new Set(suggested.map((entry) => entry.ticket.id));
    return ranked.filter((entry) => !suggestedIds.has(entry.ticket.id)).filter((entry) => matchesQuery(entry.ticket, query));
  }, [ranked, suggested, query]);

  const canConfirm = !loading && Boolean(selected);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <section role="dialog" aria-modal="true" className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0F2C59]">Marcar como duplicado · {ticket.publicId}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">Vincular a un ticket principal</h2>
            <p className="mt-0.5 text-xs text-slate-500">Elegí el ticket que va a centralizar la gestión de este incidente.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={loading} aria-label="Cerrar" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {candidatesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#0F2C59]" />
            </div>
          ) : candidatesError ? (
            <p className="py-4 text-center text-xs text-red-600">{candidatesError}</p>
          ) : (
            <>
              {suggested.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <Link2 className="h-3.5 w-3.5" /> Sugeridos
                  </p>
                  <div className="space-y-2">
                    {suggested.map(({ ticket: candidate, matchReasons }) => (
                      <CandidateRow
                        key={candidate.id}
                        candidate={candidate}
                        matchReasons={matchReasons}
                        selected={selected?.id === candidate.id}
                        onSelect={setSelected}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por N° de ticket, resumen o tipo…"
                    className="w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">{query ? "Sin resultados para esa búsqueda." : "No hay más tickets disponibles."}</p>
                  ) : (
                    searchResults.map(({ ticket: candidate, matchReasons }) => (
                      <CandidateRow
                        key={candidate.id}
                        candidate={candidate}
                        matchReasons={matchReasons}
                        selected={selected?.id === candidate.id}
                        onSelect={setSelected}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-500">
            {selected ? (
              <>
                Vas a vincular con <strong>{selected.publicId}</strong>.
              </>
            ) : (
              "Seleccioná un ticket principal."
            )}
          </p>
          <div className="flex gap-2">
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
              onClick={() => onConfirm({ mainTicketId: selected.id, mainTicketPublicId: selected.publicId })}
              disabled={!canConfirm}
              className="inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173d73] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Vinculando…" : "Confirmar vínculo"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
