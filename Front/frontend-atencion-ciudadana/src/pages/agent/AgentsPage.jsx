import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { useAgentDirectory } from "../../hooks/useAgentDirectory";

const ROLE_LABELS = {
  AGENT: "Agente",
  AREA_RESPONSIBLE: "Responsable de área",
  ADMIN: "Administrador",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const fold = (value) => (value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function initials(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function avatarColor(id) {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function slaClass(value) {
  if (value === null) return "text-slate-400";
  if (value >= 95) return "text-emerald-600";
  if (value >= 90) return "text-amber-600";
  return "text-red-600";
}

function StatCard({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-700 lg:w-48">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function AgentRow({ agent }) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${avatarColor(agent.id)}`} aria-hidden="true">
            {initials(agent.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{agent.name}</p>
            {agent.email && <p className="mt-0.5 truncate text-xs text-slate-500">{agent.email}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-700">{ROLE_LABELS[agent.role] || agent.role || "—"}</td>
      <td className="px-4 py-4 text-sm font-medium text-slate-700">{agent.areaId || "Sin área"}</td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${agent.active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
          {agent.active ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{agent.activeTickets}</td>
      <td className={`px-4 py-4 text-sm font-bold ${slaClass(agent.slaCompliance)}`}
        title={agent.slaCompliance === null ? undefined : `${agent.slaMet} cumplidos, ${agent.slaBreached} vencidos`}>
        {agent.slaCompliance === null ? "Sin datos" : `${agent.slaCompliance}%`}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{agent.resolvedThisMonth}</td>
    </tr>
  );
}

export default function AgentsPage() {
  const { agents, loading, error, reload } = useAgentDirectory();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [area, setArea] = useState("");
  const [state, setState] = useState("");

  const areas = useMemo(() => [...new Set(agents.map((agent) => agent.areaId).filter(Boolean))].sort(), [agents]);
  const filtered = useMemo(() => {
    const needle = fold(query.trim());
    return agents.filter((agent) => fold(`${agent.name} ${agent.email || ""}`).includes(needle)
      && (!role || agent.role === role)
      && (!area || agent.areaId === area)
      && (!state || (state === "active") === agent.active));
  }, [agents, query, role, area, state]);
  const activeFilters = query || role || area || state;
  const activePeople = agents.filter((agent) => agent.active).length;
  const assigned = agents.reduce((sum, agent) => sum + agent.activeTickets, 0);
  const resolved = agents.reduce((sum, agent) => sum + agent.resolvedThisMonth, 0);
  const clearFilters = () => { setQuery(""); setRole(""); setArea(""); setState(""); };

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700"><Users className="h-3.5 w-3.5" /> Equipo de atención</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agentes</h1>
          <p className="mt-1 text-sm text-slate-500">Personal de M2 con su rol, área y carga de trabajo. El alta del personal y sus roles se gestionan fuera de esta pantalla.</p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6 md:px-8 md:py-8">
        {error ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span>
            <button type="button" onClick={() => void reload()} className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        ) : loading ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando el directorio del personal…
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Personal activo" value={activePeople} />
              <StatCard label="Tickets activos asignados" value={assigned} />
              <StatCard label="Resueltos este mes" value={resolved} tone="text-emerald-600" />
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <span className="sr-only">Buscar por nombre o correo</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo…"
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <FilterSelect label="Filtrar por rol" value={role} onChange={setRole}>
                  <option value="">Todos los roles</option>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </FilterSelect>
                <FilterSelect label="Filtrar por área" value={area} onChange={setArea}>
                  <option value="">Todas las áreas</option>
                  {areas.map((item) => <option key={item} value={item}>{item}</option>)}
                </FilterSelect>
                <FilterSelect label="Filtrar por estado" value={state} onChange={setState}>
                  <option value="">Activos e inactivos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </FilterSelect>
                {activeFilters && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-red-600 hover:underline">Limpiar filtros</button>}
              </div>
            </section>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-900">Directorio del equipo</h2>
                <p className="mt-0.5 text-xs text-slate-500">{filtered.length} {filtered.length === 1 ? "persona encontrada" : "personas encontradas"}</p>
              </div>
              {filtered.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[830px] text-left">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-5 py-3">Persona</th>
                        <th scope="col" className="px-4 py-3">Rol</th>
                        <th scope="col" className="px-4 py-3">Área</th>
                        <th scope="col" className="px-4 py-3">Estado</th>
                        <th scope="col" className="px-4 py-3">Tickets activos</th>
                        <th scope="col" className="px-4 py-3">Cumplimiento SLA</th>
                        <th scope="col" className="px-4 py-3">Resueltos este mes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((agent) => <AgentRow key={agent.id} agent={agent} />)}
                    </tbody>
                  </table>
                </div>
              )}
              {filtered.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Search className="h-5 w-5" /></span>
                  {agents.length === 0 ? (
                    <p className="font-semibold text-slate-800">Todavía no hay personal cargado en M2</p>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-800">No encontramos personas con esos filtros</p>
                      <p className="mt-1 text-sm text-slate-500">Probá con otros términos o quitá algún filtro.</p>
                    </>
                  )}
                </div>
              )}
            </section>
            <p className="text-xs text-slate-500">
              El cumplimiento de SLA toma el último ciclo cerrado del SLA de resolución de cada ticket asignado. «Este mes» se cuenta en hora de Buenos Aires.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
