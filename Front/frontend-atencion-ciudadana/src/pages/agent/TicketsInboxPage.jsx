import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Search, Filter, RefreshCw, Download, Columns, Bell, Loader2, Check, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import TicketTable from "../../components/ui/TicketTable";
import { useAgentTickets } from "../../hooks/useAgentTickets";
import { useNeighborhoods } from "../../hooks/useNeighborhoods";
import { fetchCategories } from "../../services/apiClient";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";

const PAGE_SIZE = 20;
const PRIORITY_LABELS = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };

const getDisplayDate = (value) => new Date(value).toLocaleDateString("es-AR");

function mapTicket(ticket) {
  return {
    ...ticket,
    ticketType: ticket.ticketType,
    summary: ticket.summary,
    category: ticket.categoryName || ticket.requestTypeName || ticket.ticketType,
    priority: ticket.currentPriority,
    neighborhood: ticket.neighborhoodName || "Sin barrio",
    status: TICKET_STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus,
    createdAt: getDisplayDate(ticket.createdAt),
    updatedAt: getDisplayDate(ticket.updatedAt),
    assignee: ticket.assignedAgentId
      ? { name: `Agente #${ticket.assignedAgentId}`, avatar: null }
      : { name: "Sin asignar", avatar: null },
    citizen: ticket.anonymous
      ? { name: "Anónimo", initials: "AN" }
      : { name: "Ciudadano registrado", initials: "—" },
    slaIndicator: { status: "not-applicable" },
    isEscalated: Boolean(ticket.escalated),
  };
}

export default function TicketsInboxPage() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [downloadState, setDownloadState] = useState("idle");
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState({
    categoryId: "",
    priority: "",
    neighborhoodId: "",
    status: "",
  });

  const [categories, setCategories] = useState([]);
  const { neighborhoods } = useNeighborhoods();

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((res) => {
        if (!cancelled) setCategories(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveStatus = activeTab === "Resueltos" ? "RESOLVED" : filters.status;

  const { tickets: rawTickets, totalElements, totalPages, loading, error, refetch } = useAgentTickets({
    categoryId: filters.categoryId || undefined,
    priority: filters.priority || undefined,
    neighborhoodId: filters.neighborhoodId || undefined,
    status: effectiveStatus || undefined,
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });

  const inboxTickets = useMemo(() => rawTickets.map(mapTicket), [rawTickets]);

  const handleFilterChange = (key, value) => {
    setPage(0);
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
  };

  const handleTabChange = (tab) => {
    setPage(0);
    setActiveTab(tab);
  };

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return inboxTickets;
    const query = searchQuery.toLowerCase();
    return inboxTickets.filter(
      (ticket) =>
        ticket.publicId?.toLowerCase().includes(query) ||
        ticket.id?.toLowerCase().includes(query) ||
        ticket.summary?.toLowerCase().includes(query)
    );
  }, [inboxTickets, searchQuery]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState([
    { id: "clave", label: "CLAVE", visible: true },
    { id: "summary", label: "RESUMEN", visible: true },
    { id: "citizen", label: "INFORMADOR", visible: true },
    { id: "assignee", label: "RESPONSABLE", visible: true },
    { id: "status", label: "ESTADO", visible: true },
    { id: "createdAt", label: "CREADO", visible: true },
    { id: "sla", label: "SLA", visible: true },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDownloadCSV = () => {
    if (downloadState !== "idle") return;
    setDownloadState("downloading");

    setTimeout(() => {
      if (filteredTickets.length > 0) {
        const headers = columns.filter((c) => c.visible).map((c) => c.label);
        const rows = filteredTickets.map((t) => {
          return columns
            .filter((c) => c.visible)
            .map((c) => {
              switch (c.id) {
                case "clave":
                  return t.publicId || t.id;
                case "summary":
                  return `"${t.summary}"`;
                case "citizen":
                  return `"${t.citizen.name}"`;
                case "assignee":
                  return `"${t.assignee ? t.assignee.name : "Sin asignar"}"`;
                case "status":
                  return t.status;
                case "createdAt":
                  return t.createdAt;
                case "sla":
                  return "—";
                default:
                  return "";
              }
            });
        });

        const csvContent =
          "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tickets_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setDownloadState("success");
      setTimeout(() => setDownloadState("idle"), 1500);
    }, 800);
  };

  const toggleColumn = (id) => {
    setColumns((prev) => prev.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col)));
  };

  return (
    <div className="flex h-full flex-col min-w-0 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 border-b border-slate-200 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{activeTab}</h2>

        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-[#0F2C59] focus:bg-white transition-all"
            />
          </div>
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#D63031] rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200 px-4 md:px-6 hide-scrollbar">
        <div className="flex space-x-6 min-w-max">
          <TabItem label="Todos" active={activeTab === "Todos"} onClick={() => handleTabChange("Todos")} />
          <TabItem label="Resueltos" active={activeTab === "Resueltos"} onClick={() => handleTabChange("Resueltos")} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-[#0F2C59] text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setPage(0);
                setFilters({ categoryId: "", priority: "", neighborhoodId: "", status: "" });
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500 relative">
          <button onClick={handleRefresh} className="p-1.5 rounded hover:bg-slate-200 transition-colors" title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? "animate-spin text-[#0F2C59]" : ""}`} />
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={downloadState !== "idle"}
            className={`p-1.5 rounded transition-colors duration-300 ${
              downloadState === "success"
                ? "bg-green-100 text-green-600"
                : downloadState !== "idle"
                  ? "bg-slate-100 cursor-wait"
                  : "hover:bg-slate-200 text-slate-500"
            }`}
            title="Descargar CSV"
          >
            <div className="relative w-4 h-4 flex items-center justify-center">
              <AnimatePresence mode="popLayout" initial={false}>
                {downloadState === "idle" && (
                  <motion.div key="idle" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Download className="h-4 w-4" />
                  </motion.div>
                )}
                {downloadState === "downloading" && (
                  <motion.div key="downloading" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Loader2 className="h-4 w-4 animate-spin text-[#0F2C59]" />
                  </motion.div>
                )}
                {downloadState === "success" && (
                  <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Check className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className={`p-1.5 rounded transition-colors ${showColumnMenu ? "bg-slate-200 text-slate-700" : "hover:bg-slate-200"}`}
              title="Configurar columnas"
            >
              <Columns className="h-4 w-4" />
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 z-10 py-1">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">Columnas visibles</div>
                <Reorder.Group axis="y" values={columns} onReorder={setColumns}>
                  {columns.map((col) => (
                    <Reorder.Item key={col.id} value={col}>
                      <div className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-grab active:cursor-grabbing border-b border-transparent hover:border-slate-100 group bg-white">
                        <div className="mr-2 text-slate-300 opacity-50 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        <label className="flex items-center text-sm text-slate-700 cursor-pointer flex-1" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} className="mr-3 rounded border-slate-300 text-[#0F2C59] focus:ring-[#0F2C59]" />
                          <span className="capitalize">{col.label.toLowerCase()}</span>
                        </label>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange("categoryId", e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59]"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Prioridad</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59]"
            >
              <option value="">Todas</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Barrio</label>
            <select
              value={filters.neighborhoodId}
              onChange={(e) => handleFilterChange("neighborhoodId", e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59]"
            >
              <option value="">Todos</option>
              {neighborhoods.map((barrio) => (
                <option key={barrio.id} value={barrio.id}>
                  {barrio.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              disabled={activeTab === "Resueltos"}
              className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59] disabled:opacity-50"
            >
              <option value="">Todos</option>
              {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#fafafa]">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#0F2C59]" />
          </div>
        ) : (
          <TicketTable tickets={filteredTickets} columns={columns} />
        )}
      </div>

      <div className="border-t border-slate-200 p-4 bg-white flex items-center justify-between text-sm text-slate-500">
        <span>
          {totalElements > 0
            ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} incidencias`
            : "0 incidencias"}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages || loading}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TabItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 pt-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? "border-[#0F2C59] text-[#0F2C59]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
