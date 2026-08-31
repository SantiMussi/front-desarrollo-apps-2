import { useState, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Search, Filter, RefreshCw, Download, Columns, Bell, Loader2, Check } from "lucide-react";
import { 
  MOCK_TICKETS, 
  MOCK_CATEGORIES_LIST, 
  MOCK_CITIZENS,
  MOCK_PRIORITIES, 
  MOCK_NEIGHBORHOODS,
  MOCK_REQUEST_TYPES_LIST,
  MOCK_SUBCATEGORIES_LIST,
  MOCK_STATUSES,
  MOCK_TICKET_LOCATIONS_LIST,
  MOCK_USERS_LIST
} from "../../data/mockTickets";
import TicketTable from "../../components/ui/TicketTable";

import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";

const CURRENT_AGENT_ID = "AGENT-014";

const getDisplayDate = (value) => new Date(value).toLocaleDateString("es-AR");
const TERMINAL_STATUSES = ["RESOLVED", "CLOSED", "DUPLICATE", "CANCELLED"];

const inboxTickets = MOCK_TICKETS.map((ticket) => {
  const requestType = MOCK_REQUEST_TYPES_LIST.find((item) => item.id === ticket.requestTypeId);
  const subcategory = requestType && MOCK_SUBCATEGORIES_LIST.find((item) => item.id === requestType.subcategoryId);
  const category = subcategory && MOCK_CATEGORIES_LIST.find((item) => item.id === subcategory.categoryId);
  const location = MOCK_TICKET_LOCATIONS_LIST.find((item) => item.ticketId === ticket.id);
  const citizen = MOCK_CITIZENS.find((item) => item.id === ticket.citizenId);
  const assignedUser = MOCK_USERS_LIST.find((item) => item.id === ticket.assignedAgentId);
  const neighborhood = MOCK_NEIGHBORHOODS.find((item) => item.id === location?.neighborhoodId);

  return {
    ...ticket,
    summary: ticket.summary,
    description: ticket.description,
    category: category?.name || requestType?.name || ticket.ticketType,
    priority: ticket.currentPriorityFactor,
    neighborhood: neighborhood?.name || "Sin barrio",
    status: TICKET_STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus,
    createdAt: getDisplayDate(ticket.createdAt),
    updatedAt: getDisplayDate(ticket.updatedAt),
    location: location?.addressLine || "Ubicación pendiente",
    assignee: assignedUser
      ? { name: assignedUser.id === CURRENT_AGENT_ID ? "Tú" : assignedUser.name, avatar: assignedUser.avatar }
      : { name: "Sin asignar", avatar: null },
    citizen: ticket.anonymous
      ? { name: "Anónimo", initials: "AN", email: null }
      : { name: citizen?.name || "Ciudadano no encontrado", initials: citizen?.initials || "??", email: citizen?.email || null },
    sla: ticket.currentStatus === "RESOLVED"
      ? "Confirmación pendiente"
      : ["CLOSED", "CANCELLED", "DUPLICATE"].includes(ticket.currentStatus)
        ? "-"
        : "En plazo"
  };
});

export default function TicketsInboxPage() {
  const [activeTab, setActiveTab] = useState("Asignados a mí");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [downloadState, setDownloadState] = useState("idle");
  
  const [filters, setFilters] = useState({
    category: "",
    priority: "",
    neighborhood: "",
    status: ""
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? "" : value 
    }));
  };

  const counts = useMemo(() => {
    return {
      todosAbiertos: inboxTickets.filter(t => !TERMINAL_STATUSES.includes(t.currentStatus)).length,
      asignados: inboxTickets.filter(t => t.assignedAgentId === CURRENT_AGENT_ID).length,
      sinAsignar: inboxTickets.filter(t => !t.assignedAgentId).length,
      vencidos: inboxTickets.filter(t => t.sla && t.sla.includes("Vencido")).length,
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return inboxTickets.filter((ticket) => {
      // 1. Sidebar Tab logic
      if (activeTab === "Asignados a mí" && ticket.assignedAgentId !== CURRENT_AGENT_ID) return false;
      if (activeTab === "Todos abiertos" && TERMINAL_STATUSES.includes(ticket.currentStatus)) return false;
      if (activeTab === "Sin asignar" && ticket.assignedAgentId) return false;
      if (activeTab === "SLA Vencido / En Riesgo" && (!ticket.sla || !ticket.sla.includes("Vencido"))) return false;
      if (activeTab === "Resueltos" && ticket.status !== "Resuelto") return false;
      
      // 2. Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          ticket.id.toLowerCase().includes(query) || 
          ticket.summary.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 3. Dropdown Filters
      if (filters.category && ticket.category !== filters.category) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.neighborhood && ticket.neighborhood !== filters.neighborhood) return false;
      if (filters.status && ticket.status !== filters.status) return false;

      return true;
    });
  }, [activeTab, searchQuery, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState([
    { id: 'clave', label: 'CLAVE', visible: true },
    { id: 'summary', label: 'RESUMEN', visible: true },
    { id: 'citizen', label: 'INFORMADOR', visible: true },
    { id: 'assignee', label: 'RESPONSABLE', visible: true },
    { id: 'status', label: 'ESTADO', visible: true },
    { id: 'createdAt', label: 'CREADO', visible: true },
    { id: 'sla', label: 'SLA', visible: true }
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate network delay
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDownloadCSV = () => {
    if (downloadState !== "idle") return;
    setDownloadState("downloading");
    
    setTimeout(() => {
      if (filteredTickets.length > 0) {
        const headers = columns.filter(c => c.visible).map(c => c.label);
        const rows = filteredTickets.map(t => {
          return columns.filter(c => c.visible).map(c => {
            switch(c.id) {
              case 'clave': return t.id;
              case 'summary': return `"${t.summary}"`;
              case 'citizen': return `"${t.citizen.name}"`;
              case 'assignee': return `"${t.assignee ? t.assignee.name : "Sin asignar"}"`;
              case 'status': return t.status;
              case 'createdAt': return t.createdAt;
              case 'sla': return t.sla || "-";
              default: return "";
            }
          });
        });
        
        const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
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
    setColumns(prev => prev.map(col => col.id === id ? { ...col, visible: !col.visible } : col));
  };

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Inner Sidebar for Tickets */}
      <div className="w-full md:w-64 border-r border-slate-200 bg-[#fafafa] flex-shrink-0">
        <div className="p-4 md:p-6 pb-2">
          <h2 className="text-xl font-bold text-slate-900">Tickets</h2>
        </div>
        
        <div className="px-3 py-2 space-y-1">
          <SidebarItem 
            label="Todos abiertos" 
            count={counts.todosAbiertos} 
            active={activeTab === "Todos abiertos"} 
            onClick={() => setActiveTab("Todos abiertos")}
          />
          <SidebarItem 
            label="Asignados a mí" 
            count={counts.asignados} 
            active={activeTab === "Asignados a mí"} 
            onClick={() => setActiveTab("Asignados a mí")}
          />
          <SidebarItem 
            label="Sin asignar" 
            count={counts.sinAsignar} 
            active={activeTab === "Sin asignar"} 
            onClick={() => setActiveTab("Sin asignar")}
          />
          <SidebarItem 
            label="SLA Vencido / En Riesgo" 
            count={counts.vencidos} 
            active={activeTab === "SLA Vencido / En Riesgo"} 
            onClick={() => setActiveTab("SLA Vencido / En Riesgo")}
            danger
          />
          
          <div className="pt-4 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Resueltos
          </div>
          <SidebarItem 
            label="Resueltos recientemente" 
            active={activeTab === "Resueltos"} 
            onClick={() => setActiveTab("Resueltos")}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header Row */}
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

        {/* Toolbar Row */}
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
                onClick={() => setFilters({category: "", priority: "", neighborhood: "", status: ""})}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-slate-500 relative">
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors" 
              title="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#0F2C59]' : ''}`} />
            </button>
            <button 
              onClick={handleDownloadCSV}
              disabled={downloadState !== "idle"}
              className={`p-1.5 rounded transition-colors duration-300 ${
                downloadState === "success" ? 'bg-green-100 text-green-600' :
                downloadState !== "idle" ? 'bg-slate-100 cursor-wait' : 'hover:bg-slate-200 text-slate-500'
              }`} 
              title="Descargar CSV"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  {downloadState === "idle" && (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Download className="h-4 w-4" />
                    </motion.div>
                  )}
                  {downloadState === "downloading" && (
                    <motion.div
                      key="downloading"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-[#0F2C59]" />
                    </motion.div>
                  )}
                  {downloadState === "success" && (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className={`p-1.5 rounded transition-colors ${showColumnMenu ? 'bg-slate-200 text-slate-700' : 'hover:bg-slate-200'}`}
                title="Configurar columnas"
              >
                <Columns className="h-4 w-4" />
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 z-10 py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                    Columnas visibles
                  </div>
                  <Reorder.Group axis="y" values={columns} onReorder={setColumns}>
                    {columns.map((col) => (
                      <Reorder.Item key={col.id} value={col}>
                        <div 
                          className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-grab active:cursor-grabbing border-b border-transparent hover:border-slate-100 group bg-white"
                        >
                          <div className="mr-2 text-slate-300 opacity-50 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                          </div>
                          <label className="flex items-center text-sm text-slate-700 cursor-pointer flex-1" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={col.visible}
                              onChange={() => toggleColumn(col.id)}
                              className="mr-3 rounded border-slate-300 text-[#0F2C59] focus:ring-[#0F2C59]"
                            />
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

        {/* Expandable Filter Area */}
        {showFilters && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
              <select 
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              >
                <option value="">Todas</option>
                {MOCK_CATEGORIES_LIST.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
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
                {MOCK_PRIORITIES.map(prio => (
                  <option key={prio} value={prio}>{prio}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Barrio</label>
              <select 
                value={filters.neighborhood}
                onChange={(e) => handleFilterChange("neighborhood", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              >
                <option value="">Todos</option>
                {MOCK_NEIGHBORHOODS.map(barrio => (
                  <option key={barrio.id} value={barrio.name}>{barrio.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              >
                <option value="">Todos</option>
                {MOCK_STATUSES.map(est => (
                  <option key={est} value={TICKET_STATUS_LABELS[est] || est}>{TICKET_STATUS_LABELS[est] || est}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#fafafa]">
          <TicketTable tickets={filteredTickets} columns={columns} />
        </div>
        
        {/* Pagination / Footer */}
        <div className="border-t border-slate-200 p-4 bg-white flex items-center justify-between text-sm text-slate-500">
          <span>{filteredTickets.length > 0 ? `1-${filteredTickets.length} de ${filteredTickets.length} incidencias` : '0 incidencias'}</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, count, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between pl-4 pr-3 py-2 rounded-r-lg text-sm transition-colors relative ${
        active 
          ? "bg-slate-100/70 font-semibold text-[#0F2C59]" 
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-[#0F2C59] rounded-r-md" />
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
          danger 
            ? "bg-[#D63031]/10 text-[#D63031]" 
            : active 
              ? "bg-slate-200 text-[#0F2C59]" 
              : "bg-slate-100 text-slate-500"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
