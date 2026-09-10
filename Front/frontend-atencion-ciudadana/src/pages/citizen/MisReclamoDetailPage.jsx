import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Tag,
  ImageOff,
  Loader2,
  Info,
  Send,
  Star,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  TICKET_STATUS_LABELS,
  statusTone,
  TERMINAL_STATUSES,
} from "../../constants/ticketStatuses";
import { useMyTicketDetail } from "../../hooks/useMyTicketDetail";

const dateTime = (v) =>
  v
    ? new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";

const dateOnly = (v) =>
  v
    ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(v)
      )
    : "—";

const shortId = (publicId) => `#${String(publicId).replace(/\D/g, "").replace(/^0+/, "") || publicId}`;

function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white ${className}`}>
      {title && (
        <header className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
          {Icon && <Icon className="h-4 w-4 text-[#D63031]" strokeWidth={2} />}
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {title}
          </h2>
        </header>
      )}
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function StatusPill({ status }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {TICKET_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function StatusHistory({ history }) {
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-neutral-200" aria-hidden />
      {history.map((h, i) => {
        const last = i === history.length - 1;
        const tone = statusTone(h.newStatus);
        return (
          <li key={h.id} className="relative">
            <span
              className={`absolute -left-5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                last ? tone.dot : "bg-neutral-300"
              }`}
            />
            <p className="text-[13px] font-semibold text-neutral-800">
              {TICKET_STATUS_LABELS[h.newStatus] ?? h.newStatus}
            </p>
            <p className="text-[12px] text-neutral-400">{dateTime(h.occurredAt)}</p>
            {h.message && <p className="mt-0.5 text-[12.5px] text-neutral-600">{h.message}</p>}
          </li>
        );
      })}
    </ol>
  );
}

function AttentionRating({ value, onRate }) {
  const [hover, setHover] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (value) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800">
        ¡Gracias por tu opinión! Calificaste la atención con {value}/5.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-neutral-700">¿Cómo calificarías la atención?</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 text-neutral-400 hover:text-neutral-600"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-0.5 text-[11.5px] text-neutral-400">
        Tu opinión ayuda a mejorar los servicios de la ciudad.
      </p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onRate(n)}
            aria-label={`${n} estrellas`}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 ${
                n <= hover ? "fill-amber-400 text-amber-400" : "text-neutral-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MisReclamoDetailPage() {
  const { publicId } = useParams();
  const { ticket, loading, error, source, actions, actionLoading, actionError } =
    useMyTicketDetail(publicId);

  const [reopenMode, setReopenMode] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState([]);

  const isResolved = ticket?.currentStatus === "RESOLVED";
  const chatDisabled = useMemo(
    () => !ticket || TERMINAL_STATUSES.has(ticket.currentStatus) || ticket.currentStatus === "RESOLVED",
    [ticket]
  );
  const messages = useMemo(
    () => [...(ticket?.messages ?? []), ...localMessages],
    [ticket, localMessages]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="text-[14px] text-neutral-500">
          {error || "No encontramos este reclamo."}
        </p>
        <Link
          to="/mis-reclamos"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F2C59] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Mis Reclamos
        </Link>
      </div>
    );
  }

  const handleConfirm = () => actions.confirmResolution();

  const handleReopen = async () => {
    const ok = await actions.requestReopen(reopenReason.trim());
    if (ok) {
      setReopenMode(false);
      setReopenReason("");
    }
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || chatDisabled) return;
    setLocalMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, authorType: "CITIZEN", text, createdAt: new Date().toISOString() },
    ]);
    setDraft("");
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-neutral-400">
        <Link to="/mis-reclamos" className="hover:text-[#0F2C59]">
          Mis Reclamos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-500">Ticket {shortId(ticket.publicId)}</span>
      </nav>

      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-[#0F2C59]">
          {ticket.summary}
        </h1>
        <StatusPill status={ticket.currentStatus} />
      </div>

      {source === "sample" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Datos de ejemplo: los endpoints de detalle y confirmación/reapertura todavía no están
          disponibles en el back.
        </div>
      )}

      {/* Banner de confirmación / reapertura (solo en RESOLVED) */}
      {isResolved && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 overflow-hidden rounded-xl bg-[#0F2C59] text-white"
        >
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-[14px] font-semibold">
                  El municipio marcó este reclamo como Resuelto.
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-blue-100">
                  Revisá la solución y confirmá si el problema fue solucionado, o reabrí el reclamo
                  si persiste.
                  {ticket.resolutionConfirmationDueAt && (
                    <>
                      {" "}
                      Si no respondés antes del{" "}
                      <strong className="text-white">
                        {dateOnly(ticket.resolutionConfirmationDueAt)}
                      </strong>
                      , se cerrará automáticamente.
                    </>
                  )}
                </p>
              </div>
            </div>
            {!reopenMode && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D63031] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#c0282a] disabled:opacity-60"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar solución
                </button>
                <button
                  type="button"
                  onClick={() => setReopenMode(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reabrir ticket
                </button>
              </div>
            )}
          </div>

          {reopenMode && (
            <div className="border-t border-white/10 bg-white/[0.04] px-5 py-4">
              <label className="block text-[12.5px] font-medium text-blue-100">
                Contanos por qué el problema continúa <span className="text-blue-200/70">(opcional)</span>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={2}
                  placeholder="Ej.: el bache volvió a aparecer con la lluvia…"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/95 px-3 py-2 text-[13px] text-neutral-800 outline-none focus:ring-2 focus:ring-white/40"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D63031] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#c0282a] disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Confirmar reapertura
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReopenMode(false);
                    setReopenReason("");
                  }}
                  disabled={actionLoading}
                  className="rounded-lg border border-white/25 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <div className="border-t border-white/10 bg-red-500/15 px-5 py-2.5 text-[12.5px] text-red-100">
              {actionError}
            </div>
          )}
        </motion.div>
      )}

      {ticket.currentStatus === "CLOSED" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Confirmaste la solución. El reclamo quedó cerrado.
        </div>
      )}

      {/* Contenido */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card title="Descripción del problema">
            <p className="text-[13.5px] leading-relaxed text-neutral-600">{ticket.description}</p>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card title="Ubicación" icon={MapPin}>
              <p className="text-[13.5px] font-medium text-neutral-700">
                {ticket.location?.addressLine || "Sin ubicación"}
              </p>
              {(ticket.location?.neighborhood || ticket.location?.district) && (
                <p className="text-[12.5px] text-neutral-400">
                  {[ticket.location?.neighborhood, ticket.location?.district].filter(Boolean).join(", ")}
                </p>
              )}
            </Card>
            <Card title="Categoría" icon={Tag}>
              <p className="text-[13.5px] font-medium text-neutral-700">
                {ticket.category?.name || ticket.requestType?.name || "—"}
              </p>
              {ticket.subcategory?.name && (
                <p className="text-[12.5px] text-neutral-400">{ticket.subcategory.name}</p>
              )}
            </Card>
          </div>

          <Card title="Fotos adjuntas">
            {ticket.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-lg border border-neutral-200"
                  >
                    {att.url ? (
                      <img
                        src={att.url}
                        alt={att.name}
                        className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90"
                      />
                    ) : (
                      <span className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-neutral-400">
                        <ImageOff className="h-5 w-5" />
                      </span>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400">No se adjuntaron fotos.</p>
            )}
          </Card>

          <Card title="Historial de estados">
            <StatusHistory history={ticket.history} />
          </Card>
        </div>

        {/* Mensajes */}
        <Card title="Mensajes" className="flex h-fit flex-col">
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="py-6 text-center text-[13px] text-neutral-400">
                Todavía no hay mensajes en este reclamo.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.authorType === "CITIZEN";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed ${
                      mine
                        ? "rounded-br-sm bg-neutral-100 text-neutral-700"
                        : "rounded-bl-sm bg-[#0F2C59] text-white"
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                        {m.authorName || "Atención Vecinal"}
                      </p>
                    )}
                    <p>{m.text}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-neutral-400" : "text-blue-200/80"}`}>
                      {dateTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {(isResolved || ticket.currentStatus === "CLOSED") && (
            <div className="mt-4">
              <AttentionRating value={ticket.rating} onRate={actions.rateAttention} />
            </div>
          )}

          <div className="mt-4 border-t border-neutral-100 pt-3">
            {chatDisabled ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-center text-[11.5px] text-neutral-400">
                El chat está deshabilitado porque el reclamo está{" "}
                {(TICKET_STATUS_LABELS[ticket.currentStatus] ?? ticket.currentStatus).toLowerCase()}.
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Escribí un mensaje…"
                  className="flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#D63031]/40 focus:ring-2 focus:ring-[#D63031]/10"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                  className="rounded-lg bg-[#0F2C59] p-2 text-white transition hover:bg-[#1a3f7a] disabled:opacity-40"
                  aria-label="Enviar mensaje"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
