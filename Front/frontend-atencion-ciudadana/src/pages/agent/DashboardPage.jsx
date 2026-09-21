import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TicketCheck,
  UserRoundX,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useAgentTickets } from "../../hooks/useAgentTickets";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";
import { getSlaIndicator } from "../../utils/ticketIndicators";

const ACTIVE_STATUSES = new Set(["REGISTERED", "IN_REVIEW", "ROUTED", "IN_PROGRESS", "PENDING_INFORMATION"]);
const STATUS_COLORS = {
  REGISTERED: "bg-blue-500",
  IN_REVIEW: "bg-violet-500",
  ROUTED: "bg-cyan-500",
  IN_PROGRESS: "bg-amber-500",
  PENDING_INFORMATION: "bg-orange-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-slate-400",
};
const PRIORITY_LABELS = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };

function firstName(user) {
  const name = user?.firstName || user?.nombre || user?.name || user?.displayName;
  return name?.trim().split(/\s+/)[0] || "equipo";
}

function formatRelativeDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  const difference = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(difference / 60000));
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function StatCard({ label, value, detail, icon: Icon, tone = "navy", to = "/agente/tickets" }) {
  const tones = {
    navy: "bg-[#eaf0f8] text-[#0F2C59]",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <Link to={to} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      </div>
      <span className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#0F2C59] opacity-0 transition group-hover:opacity-100">
        Ver tickets <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 rounded-full bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></span>
      <p className="font-semibold text-slate-800">Todo al día</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">No hay tickets que requieran atención inmediata.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tickets, totalElements, loading, error, refetch } = useAgentTickets({ page: 0, size: 100, sort: "updatedAt,desc" });

  const data = useMemo(() => {
    const active = tickets.filter((ticket) => ACTIVE_STATUSES.has(ticket.currentStatus));
    const unassigned = active.filter((ticket) => !ticket.assignedAgentId);
    const breached = active.filter((ticket) => getSlaIndicator(ticket).status === "overdue");
    const atRisk = active.filter((ticket) => getSlaIndicator(ticket).status === "at-risk");
    const urgent = active
      .filter((ticket) => ticket.currentPriority === "CRITICAL" || ticket.currentPriorityFactor === "CRITICAL" || ticket.escalated || getSlaIndicator(ticket).status !== "on-track")
      .sort((a, b) => Number(Boolean(b.slaBreached)) - Number(Boolean(a.slaBreached)) || new Date(b.updatedAt) - new Date(a.updatedAt));
    const statusCounts = tickets.reduce((counts, ticket) => ({ ...counts, [ticket.currentStatus]: (counts[ticket.currentStatus] || 0) + 1 }), {});
    return { active, unassigned, breached, atRisk, urgent, statusCounts };
  }, [tickets]);

  if (loading) {
    return <div className="flex h-full items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-[#0F2C59]" /><span className="ml-3 text-sm text-slate-600">Preparando tu dashboard…</span></div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D63031]"><Sparkles className="h-3.5 w-3.5" /> Centro de operaciones</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hola, {firstName(user)}</h1>
            <p className="mt-1 text-sm text-slate-500">Este es el estado de la atención ciudadana ahora.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Actualizar
            </button>
            <Link to="/agente/tickets" className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163d75]">
              Ir a tickets <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8 md:py-8">
        {error && <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>No pudimos actualizar los datos: {error}</span><button onClick={refetch} className="font-semibold underline">Reintentar</button></div>}

        <section aria-label="Resumen operativo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tickets activos" value={data.active.length} detail={`${totalElements} tickets en total`} icon={Inbox} />
          <StatCard label="Sin asignar" value={data.unassigned.length} detail="Requieren un responsable" icon={UserRoundX} tone="blue" />
          <StatCard label="SLA vencido" value={data.breached.length} detail="Necesitan atención inmediata" icon={ShieldAlert} tone="red" />
          <StatCard label="Próximos a vencer" value={data.atRisk.length} detail="Dentro de la ventana de alerta" icon={Clock3} tone="amber" />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 className="font-bold text-slate-900">Requieren tu atención</h2><p className="mt-0.5 text-xs text-slate-500">Priorizados por SLA, escalamiento y criticidad</p></div>
              <Link to="/agente/tickets" className="flex items-center gap-1 text-sm font-semibold text-[#0F2C59] hover:underline">Ver todos <ChevronRight className="h-4 w-4" /></Link>
            </div>
            {data.urgent.length === 0 ? <EmptyState /> : (
              <div className="divide-y divide-slate-100">
                {data.urgent.slice(0, 6).map((ticket) => {
                  const sla = getSlaIndicator(ticket);
                  const priority = ticket.currentPriority || ticket.currentPriorityFactor;
                  return (
                    <Link key={ticket.id} to={`/agente/tickets/${ticket.id}`} className="group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${sla.status === "overdue" ? "bg-red-500" : sla.status === "at-risk" ? "bg-amber-500" : "bg-violet-500"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="text-xs font-bold text-[#0F2C59]">{ticket.publicId || ticket.id}</span>{ticket.escalated && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">Escalado</span>}</div>
                        <p className="mt-1 truncate text-sm font-medium text-slate-800">{ticket.summary || "Ticket sin resumen"}</p>
                      </div>
                      <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-700">{PRIORITY_LABELS[priority] || priority || "Normal"}</p><p className={`mt-1 text-xs ${sla.status === "overdue" ? "text-red-600" : sla.status === "at-risk" ? "text-amber-600" : "text-slate-400"}`}>{sla.label}</p></div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0F2C59]" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Flujo de trabajo</h2><p className="mt-0.5 text-xs text-slate-500">Distribución de la bandeja actual</p></div><CircleDot className="h-5 w-5 text-slate-400" /></div>
            <div className="mt-6 space-y-4">
              {Object.entries(TICKET_STATUS_LABELS).filter(([status]) => (data.statusCounts[status] || 0) > 0).map(([status, label]) => {
                const count = data.statusCounts[status] || 0;
                const width = tickets.length ? Math.max(4, (count / tickets.length) * 100) : 0;
                return <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-600">{label}</span><span className="font-bold text-slate-800">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${STATUS_COLORS[status] || "bg-slate-400"}`} style={{ width: `${width}%` }} /></div></div>;
              })}
              {tickets.length === 0 && <p className="py-12 text-center text-sm text-slate-500">No hay datos para mostrar.</p>}
            </div>
            <div className="mt-6 rounded-lg bg-[#f3f6fa] p-4"><div className="flex items-start gap-3"><TicketCheck className="mt-0.5 h-5 w-5 text-[#0F2C59]" /><div><p className="text-sm font-semibold text-slate-800">Vista operativa</p><p className="mt-1 text-xs leading-5 text-slate-500">Para tendencias históricas, tiempos promedio y comparaciones, consultá la sección Métricas.</p><Link to="/agente/metricas" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0F2C59] hover:underline">Abrir Métricas <ArrowRight className="h-3 w-3" /></Link></div></div></div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Actividad reciente</h2><p className="mt-0.5 text-xs text-slate-500">Últimas actualizaciones de tickets</p></div><AlertTriangle className="h-5 w-5 text-slate-400" /></div>
          <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            {tickets.slice(0, 4).map((ticket) => <Link key={ticket.id} to={`/agente/tickets/${ticket.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[ticket.currentStatus] || "bg-slate-400"}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{ticket.summary || "Ticket sin resumen"}</p><p className="mt-1 text-xs text-slate-500"><span className="font-semibold text-[#0F2C59]">{ticket.publicId || ticket.id}</span> · {TICKET_STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus}</p></div><span className="shrink-0 text-xs text-slate-400">{formatRelativeDate(ticket.updatedAt || ticket.createdAt)}</span></Link>)}
            {tickets.length === 0 && <p className="col-span-2 px-5 py-10 text-center text-sm text-slate-500">Todavía no hay actividad reciente.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}