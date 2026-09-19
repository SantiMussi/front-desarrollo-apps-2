import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDown, ArrowUp, BarChart3, CheckCircle2,
  ChevronDown, Clock3, Download, Loader2, MapPin, RefreshCw, RotateCcw, Target,
  SlidersHorizontal, TicketCheck, TrendingUp, UsersRound, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAgentTickets } from "../../hooks/useAgentTickets";
import { fetchCategories, fetchNeighborhoods } from "../../services/apiClient";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";

const PERIODS = [
  { value: 7, label: "Últimos 7 días" },
  { value: 30, label: "Últimos 30 días" },
  { value: 90, label: "Últimos 90 días" },
  { value: 365, label: "Último año" },
];
const CLOSED = new Set(["RESOLVED", "CLOSED"]);
const SLA_FILTERS = [
  { value: "", label: "Todos los SLA" },
  { value: "breached", label: "SLA vencido" },
  { value: "near_due", label: "Próximo a vencer" },
  { value: "on_track", label: "En plazo" },
];
const STATUS_COLORS = { REGISTERED: "#579DFF", IN_REVIEW: "#8777D9", ROUTED: "#00B8D9", IN_PROGRESS: "#F5CD47", PENDING_INFORMATION: "#FEA362", RESOLVED: "#4BCE97", CLOSED: "#8590A2", CANCELLED: "#C1C7D0", DUPLICATE: "#B6A7D8" };
const FALLBACK_AREA_NAMES = { "AREA-LIGHTING": "Alumbrado público", "AREA-ROADWORKS": "Obras viales", "AREA-SANITATION": "Higiene urbana", "AREA-GREEN": "Espacios verdes", "AREA-TRAFFIC": "Tránsito" };

const validDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; };
const percent = (value) => `${Math.round(value || 0)}%`;
const formatHours = (hours) => hours == null ? "—" : hours < 24 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} d`;
const nameFor = (ticket, fallback) => ticket.neighborhoodName || ticket.location?.neighborhoodName || fallback[ticket.neighborhoodId] || "Sin ubicación informada";

function Change({ value }) {
  if (value == null) return <span className="text-xs font-medium text-slate-400">Sin período anterior</span>;
  const positive = value >= 0;
  return <span className={`inline-flex items-center gap-1 text-xs font-bold ${positive ? "text-emerald-600" : "text-red-600"}`}>{positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{Math.abs(value).toFixed(1)}% <span className="font-normal text-slate-400">vs. anterior</span></span>;
}

function KpiCard({ label, value, helper, change, icon: Icon, tone = "blue" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p></div><span className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" /></span></div>
    <div className="mt-3 min-h-5">{change !== undefined ? <Change value={change} /> : <p className="text-xs text-slate-500">{helper}</p>}</div>
  </article>;
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div>{action}</header>
    <div className="p-5">{children}</div>
  </section>;
}

function TrendChart({ rows }) {
  const width = 720, height = 230, pad = 28;
  const max = Math.max(1, ...rows.map((row) => Math.max(row.created, row.closed)));
  const point = (value, index) => `${pad + (index * (width - pad * 2)) / Math.max(1, rows.length - 1)},${height - pad - (value / max) * (height - pad * 2)}`;
  const created = rows.map((row, index) => point(row.created, index)).join(" ");
  const closed = rows.map((row, index) => point(row.closed, index)).join(" ");
  return <div>
    <div className="mb-4 flex gap-5 text-xs font-medium text-slate-600"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-blue-600" />Creados</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Resueltos</span></div>
    <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label="Evolución de tickets creados y resueltos">
      {[0, .25, .5, .75, 1].map((tick) => <g key={tick}><line x1={pad} x2={width-pad} y1={height-pad-tick*(height-pad*2)} y2={height-pad-tick*(height-pad*2)} stroke="#e2e8f0" strokeDasharray="4 4" /><text x="2" y={height-pad-tick*(height-pad*2)+4} fontSize="10" fill="#94a3b8">{Math.round(max*tick)}</text></g>)}
      <polyline points={created} fill="none" stroke="#0C66E4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={closed} fill="none" stroke="#22A06B" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {rows.map((row, index) => <text key={row.label} x={pad+(index*(width-pad*2))/Math.max(1,rows.length-1)} y={height-5} textAnchor="middle" fontSize="10" fill="#64748b">{row.label}</text>)}
    </svg></div>
  </div>;
}

export default function MetricsPage() {
  const [days, setDays] = useState(30);
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [priority, setPriority] = useState("");
  const [sla, setSla] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catalog, setCatalog] = useState({ categories: {}, neighborhoods: {} });
  const { tickets, loading, error, refetch } = useAgentTickets({ page: 0, size: 1000, sort: "createdAt,desc" });

  useEffect(() => {
    Promise.allSettled([fetchCategories(), fetchNeighborhoods()]).then(([categories, neighborhoods]) => setCatalog({
      categories: Object.fromEntries((categories.value || []).map((item) => [String(item.id), item.name])),
      neighborhoods: Object.fromEntries((neighborhoods.value || []).map((item) => [String(item.id), item.name])),
    }));
  }, []);

  const areas = useMemo(() => [...new Set(tickets.map((ticket) => ticket.responsibleAreaId).filter(Boolean))].sort(), [tickets]);
  const activeFilterCount = [days !== 30, category, neighborhood, priority, sla, area].filter(Boolean).length;
  const resetFilters = () => {
    setDays(30);
    setCategory("");
    setNeighborhood("");
    setPriority("");
    setSla("");
    setArea("");
  };
  const report = useMemo(() => {
    const now = new Date();
    const start = new Date(now); start.setDate(start.getDate() - days);
    const previousStart = new Date(start); previousStart.setDate(previousStart.getDate() - days);
    const scoped = tickets.filter((ticket) => {
      if (area && ticket.responsibleAreaId !== area) return false;
      if (category && String(ticket.categoryId) !== category) return false;
      if (neighborhood && String(ticket.neighborhoodId) !== neighborhood) return false;
      if (priority && (ticket.currentPriority || ticket.currentPriorityFactor) !== priority) return false;
      if (sla === "breached" && ticket.slaBreached !== true) return false;
      if (sla === "near_due" && (ticket.slaNearDue !== true || ticket.slaBreached === true)) return false;
      if (sla === "on_track" && (ticket.slaBreached === true || ticket.slaNearDue === true)) return false;
      return true;
    });
    const current = scoped.filter((ticket) => { const date = validDate(ticket.createdAt); return date && date >= start && date <= now; });
    const previous = scoped.filter((ticket) => { const date = validDate(ticket.createdAt); return date && date >= previousStart && date < start; });
    const delta = previous.length ? ((current.length - previous.length) / previous.length) * 100 : null;
    const resolved = current.filter((ticket) => CLOSED.has(ticket.currentStatus));
    const durations = resolved.map((ticket) => { const a = validDate(ticket.createdAt), b = validDate(ticket.statusChangedAt || ticket.updatedAt); return a && b ? (b-a)/36e5 : null; }).filter((value) => value != null && value >= 0);
    const avgResolution = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
    const slaKnown = current.filter((ticket) => ticket.slaBreached != null || ticket.slaPercentage != null);
    const slaMet = slaKnown.filter((ticket) => !ticket.slaBreached && Number(ticket.slaPercentage || 0) <= 100).length;
    const slaRate = slaKnown.length ? (slaMet / slaKnown.length) * 100 : 0;
    const unassigned = current.filter((ticket) => !ticket.assignedAgentId).length;
    const bucketCount = days <= 7 ? 7 : days <= 30 ? 10 : 12;
    const bucketMs = (now - start) / bucketCount;
    const trend = Array.from({ length: bucketCount }, (_, index) => {
      const from = new Date(start.getTime() + bucketMs * index), to = new Date(start.getTime() + bucketMs * (index + 1));
      return { label: from.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).replace(" de ", " "), created: current.filter((ticket) => { const d=validDate(ticket.createdAt); return d>=from&&d<to; }).length, closed: scoped.filter((ticket) => { const d=validDate(ticket.statusChangedAt || ticket.updatedAt); return CLOSED.has(ticket.currentStatus)&&d>=from&&d<to; }).length };
    });
    const countBy = (keyFn) => Object.entries(current.reduce((acc, ticket) => { const key=keyFn(ticket); acc[key]=(acc[key]||0)+1; return acc; }, {})).sort((a,b)=>b[1]-a[1]);
    return { current, delta, resolved, avgResolution, slaRate, slaKnown: slaKnown.length, unassigned, trend,
      statuses: countBy((ticket) => ticket.currentStatus || "UNKNOWN"),
      locations: countBy((ticket) => nameFor(ticket, catalog.neighborhoods)),
      categories: countBy((ticket) => ticket.categoryName || ticket.requestTypeName || catalog.categories[String(ticket.categoryId)] || ticket.ticketType || "Sin categoría"),
      areas: countBy((ticket) => FALLBACK_AREA_NAMES[ticket.responsibleAreaId] || ticket.responsibleAreaName || ticket.responsibleAreaId || "Sin derivar"),
    };
  }, [tickets, days, area, category, neighborhood, priority, sla, catalog]);

  const exportCsv = () => {
    const rows = [["Ticket", "Creado", "Estado", "Área", "Ubicación"], ...report.current.map((ticket) => [ticket.publicId || ticket.id, ticket.createdAt, TICKET_STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus, FALLBACK_AREA_NAMES[ticket.responsibleAreaId] || ticket.responsibleAreaId || "", nameFor(ticket, catalog.neighborhoods)])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const link=document.createElement("a"); link.href=URL.createObjectURL(new Blob([`\uFEFF${csv}`], {type:"text/csv;charset=utf-8"})); link.download=`metricas-${days}-dias.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-[#0F2C59]" /><span className="ml-3 text-sm text-slate-600">Calculando métricas…</span></div>;
  const maxLocation = report.locations[0]?.[1] || 1;
  return <div className="h-full overflow-y-auto bg-[#f7f8fa]">
    <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-8"><div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700"><BarChart3 className="h-3.5 w-3.5" /> Informes y rendimiento</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Métricas de atención</h1><p className="mt-1 text-sm text-slate-500">Analizá tendencias, cumplimiento y demanda para tomar decisiones.</p></div>
        <div className="relative flex flex-wrap gap-2"><button onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /> Filtros{activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#0F2C59] px-1 text-[11px] text-white">{activeFilterCount}</span>}<ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} /></button>
          <button onClick={refetch} className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50" title="Actualizar"><RefreshCw className="h-4 w-4" /></button><button onClick={exportCsv} disabled={!report.current.length} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#163d75] disabled:opacity-50"><Download className="h-4 w-4" /> Exportar</button>
          {filtersOpen && <div className="absolute right-0 top-12 z-30 w-[min(92vw,34rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-900">Filtrar métricas</p><p className="text-xs text-slate-500">Combiná los criterios para actualizar los indicadores.</p></div><button onClick={() => setFiltersOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar filtros"><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Período<select value={days} onChange={(e)=>setDays(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">{PERIODS.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Categoría<select value={category} onChange={(e)=>setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"><option value="">Todas las categorías</option>{Object.entries(catalog.categories).map(([id, name])=><option key={id} value={id}>{name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Barrio<select value={neighborhood} onChange={(e)=>setNeighborhood(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"><option value="">Todos los barrios</option>{Object.entries(catalog.neighborhoods).map(([id, name])=><option key={id} value={id}>{name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Prioridad<select value={priority} onChange={(e)=>setPriority(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"><option value="">Todas las prioridades</option>{Object.entries({ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" }).map(([id, name])=><option key={id} value={id}>{name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">SLA<select value={sla} onChange={(e)=>setSla(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">{SLA_FILTERS.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Área responsable<select value={area} onChange={(e)=>setArea(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"><option value="">Todas las áreas</option>{areas.map((id)=><option key={id} value={id}>{FALLBACK_AREA_NAMES[id] || id}</option>)}</select></label></div><div className="mt-4 flex justify-end"><button onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><RotateCcw className="h-3.5 w-3.5" /> Restablecer filtros</button></div></div>}
        </div></div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800"><Activity className="h-4 w-4 shrink-0" /><span>Esta vista es analítica e histórica. Para el trabajo del día y alertas en tiempo real, usá el <Link to="/agente/dashboard" className="font-bold underline">Dashboard operativo</Link>.</span></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8 md:py-8">
      {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" /> No pudimos cargar todos los datos: {error}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Tickets creados" value={report.current.length.toLocaleString("es-AR")} change={report.delta} icon={TrendingUp} /><KpiCard label="Tasa de resolución" value={percent(report.current.length ? report.resolved.length/report.current.length*100 : 0)} helper={`${report.resolved.length} resueltos en el período`} icon={CheckCircle2} tone="green" /><KpiCard label="Tiempo medio de resolución" value={formatHours(report.avgResolution)} helper="Desde creación hasta última resolución" icon={Clock3} tone="violet" /><KpiCard label="Cumplimiento de SLA" value={report.slaKnown ? percent(report.slaRate) : "—"} helper={report.slaKnown ? `${report.slaKnown} tickets con medición` : "Sin datos de SLA en el período"} icon={Target} tone="amber" /></section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]"><Panel title="Demanda a lo largo del tiempo" subtitle="Tickets creados frente a tickets resueltos en el período"><TrendChart rows={report.trend} /></Panel><Panel title="Estado de los tickets" subtitle="Distribución actual de los creados en el período"><div className="space-y-3">{report.statuses.map(([status,count])=><div key={status}><div className="mb-1.5 flex justify-between text-xs"><span className="flex items-center gap-2 font-medium text-slate-600"><i className="h-2.5 w-2.5 rounded-full" style={{background:STATUS_COLORS[status]||"#64748b"}} />{TICKET_STATUS_LABELS[status]||status}</span><span className="font-bold text-slate-800">{count} · {percent(count/report.current.length*100)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{width:`${count/report.current.length*100}%`,background:STATUS_COLORS[status]||"#64748b"}} /></div></div>)}{!report.statuses.length&&<p className="py-16 text-center text-sm text-slate-500">No hay tickets en este período.</p>}</div></Panel></div>
      <div className="grid gap-6 lg:grid-cols-2"><Panel title="Demanda por ubicación" subtitle="Barrios o zonas con más solicitudes" action={<MapPin className="h-5 w-5 text-slate-400" />}><div className="space-y-4">{report.locations.slice(0,7).map(([name,count],index)=><div key={name} className="grid grid-cols-[24px_minmax(0,1fr)_40px] items-center gap-3"><span className="text-xs font-bold text-slate-400">{index+1}</span><div><div className="mb-1.5 flex justify-between"><span className="truncate text-sm font-medium text-slate-700">{name}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{width:`${count/maxLocation*100}%`}} /></div></div><span className="text-right text-sm font-bold text-slate-800">{count}</span></div>)}{!report.locations.length&&<p className="py-12 text-center text-sm text-slate-500">Sin ubicaciones para mostrar.</p>}</div></Panel>
        <Panel title="Volumen por categoría" subtitle="Motivos que generan más contactos" action={<TicketCheck className="h-5 w-5 text-slate-400" />}><div className="space-y-3">{report.categories.slice(0,7).map(([name,count],index)=><div key={name} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"><span className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${index<3?"bg-blue-50 text-blue-700":"bg-slate-100 text-slate-600"}`}>{index+1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{name}</span><span className="text-sm font-bold text-slate-900">{count}</span><span className="w-11 text-right text-xs text-slate-400">{percent(count/report.current.length*100)}</span></div>)}{!report.categories.length&&<p className="py-12 text-center text-sm text-slate-500">Sin categorías para mostrar.</p>}</div></Panel></div>
      <Panel title="Rendimiento por área" subtitle="Carga recibida y participación sobre el volumen total" action={<UsersRound className="h-5 w-5 text-slate-400" />}><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="pb-3 font-semibold">Área responsable</th><th className="pb-3 text-right font-semibold">Tickets</th><th className="pb-3 text-right font-semibold">Participación</th><th className="pb-3 pl-8 font-semibold">Distribución</th></tr></thead><tbody>{report.areas.map(([name,count])=><tr key={name} className="border-b border-slate-100 last:border-0"><td className="py-4 font-medium text-slate-800">{name}</td><td className="py-4 text-right font-bold text-slate-900">{count}</td><td className="py-4 text-right text-slate-600">{percent(count/report.current.length*100)}</td><td className="py-4 pl-8"><div className="h-2 min-w-32 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#0F2C59]" style={{width:`${count/report.current.length*100}%`}} /></div></td></tr>)}</tbody></table></div></Panel>
      <div className="grid gap-4 sm:grid-cols-3"><div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"><span className="rounded-lg bg-orange-50 p-2 text-orange-600"><UsersRound className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-slate-900">{report.unassigned}</p><p className="text-xs text-slate-500">Sin agente asignado</p></div></div><div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"><span className="rounded-lg bg-red-50 p-2 text-red-600"><AlertCircle className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-slate-900">{report.current.filter((t)=>t.escalated).length}</p><p className="text-xs text-slate-500">Tickets escalados</p></div></div><div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"><span className="rounded-lg bg-violet-50 p-2 text-violet-600"><RotateCcw className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-slate-900">{report.current.reduce((sum,t)=>sum+(Number(t.reopenCount)||0),0)}</p><p className="text-xs text-slate-500">Reaperturas registradas</p></div></div></div>
    </main>
  </div>;
}