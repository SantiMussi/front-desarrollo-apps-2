import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CalendarDays, ArrowRight, Inbox, Loader2, Info } from "lucide-react";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";
import { useMyTickets } from "../../hooks/useMyTickets";

const TONES = {
  blue: { dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700", bar: "bg-blue-400" },
  amber: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700", bar: "bg-amber-400" },
  green: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-400" },
  gray: { dot: "bg-neutral-400", pill: "bg-neutral-100 text-neutral-500", bar: "bg-neutral-300" },
};

const STATUS_TONE = {
  REGISTERED: "blue",
  IN_REVIEW: "blue",
  ROUTED: "blue",
  IN_PROGRESS: "amber",
  PENDING_INFORMATION: "amber",
  RESOLVED: "green",
  CLOSED: "green",
  DUPLICATE: "gray",
  CANCELLED: "gray",
};

const RESOLVED = new Set(["RESOLVED", "CLOSED"]);
const CLOSED_OUT = new Set(["RESOLVED", "CLOSED", "CANCELLED", "DUPLICATE"]);

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "en-curso", label: "En curso" },
  { id: "resueltos", label: "Resueltos" },
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(value)
      )
    : "—";

function TicketCard({ ticket }) {
  const tone = TONES[STATUS_TONE[ticket.currentStatus] ?? "gray"];
  const area = ticket.category?.name || ticket.requestType?.name || "Reclamo";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />

      <div className="flex flex-1 flex-col p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {area}
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {TICKET_STATUS_LABELS[ticket.currentStatus] ?? ticket.currentStatus}
          </span>
        </div>

        <p className="mt-1 font-mono text-[15px] font-bold text-[#0F2C59]">{ticket.publicId}</p>

        <p className="mt-2 text-[14px] font-semibold text-neutral-800">{ticket.summary}</p>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">
          {ticket.description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(ticket.createdAt)}
          </span>
          <Link
            to={`/mis-reclamos/${encodeURIComponent(ticket.publicId)}`}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#D63031] hover:gap-1.5"
          >
            Ver detalles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function MisReclamosPage() {
  const { tickets, loading, error, source } = useMyTickets();
  const [filter, setFilter] = useState("todos");

  const counts = useMemo(
    () => ({
      todos: tickets.length,
      "en-curso": tickets.filter((t) => !CLOSED_OUT.has(t.currentStatus)).length,
      resueltos: tickets.filter((t) => RESOLVED.has(t.currentStatus)).length,
    }),
    [tickets]
  );

  const visible = useMemo(() => {
    if (filter === "en-curso") return tickets.filter((t) => !CLOSED_OUT.has(t.currentStatus));
    if (filter === "resueltos") return tickets.filter((t) => RESOLVED.has(t.currentStatus));
    return tickets;
  }, [tickets, filter]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-[#0F2C59]">Mis Tickets</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Seguimiento de todos tus reclamos y solicitudes iniciadas en la Municipalidad.
          </p>
        </div>
        <Link
          to="/portal-ayuda"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1a3f7a]"
        >
          <Plus className="h-4 w-4" />
          Nuevo Reclamo
        </Link>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              filter === f.id
                ? "bg-[#0F2C59] text-white"
                : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 ${filter === f.id ? "text-white/70" : "text-neutral-400"}`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {source === "sample" && !loading && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Datos de ejemplo: no pudimos conectar con <code className="font-mono">GET /me/tickets</code>.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="text-[14px] font-medium text-neutral-600">
            {filter === "todos"
              ? "Todavía no tenés reclamos registrados."
              : "No hay reclamos en esta categoría."}
          </p>
          {filter === "todos" && (
            <Link
              to="/portal-ayuda"
              className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#D63031] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Iniciar un reclamo
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((ticket) => (
            <TicketCard key={ticket.publicId} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
