import StatusBadge from "./StatusBadge";
import { motion } from "framer-motion";
import { CircleHelp, Lightbulb, Plus, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TICKET_TYPE_CONFIG = {
  COMPLAINT: { label: "Complaint", icon: TriangleAlert, className: "text-red-600 bg-red-50" },
  REQUEST: { label: "Request", icon: Plus, className: "text-blue-600 bg-blue-50" },
  QUESTION: { label: "Question", icon: CircleHelp, className: "text-amber-600 bg-amber-50" },
  SUGGESTION: { label: "Suggestion", icon: Lightbulb, className: "text-emerald-600 bg-emerald-50" }
};

export default function TicketTable({ tickets, columns }) {
  const navigate = useNavigate();
  const displayColumns = columns || [
    { id: 'clave', label: 'CLAVE', visible: true },
    { id: 'summary', label: 'RESUMEN', visible: true },
    { id: 'citizen', label: 'INFORMADOR', visible: true },
    { id: 'assignee', label: 'RESPONSABLE', visible: true },
    { id: 'status', label: 'ESTADO', visible: true },
    { id: 'createdAt', label: 'CREADO', visible: true },
    { id: 'sla', label: 'SLA', visible: true }
  ];

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No hay tickets que coincidan</h3>
        <p className="text-sm text-slate-500">
          Intenta ajustar los filtros para ver más resultados.
        </p>
      </div>
    );
  }

  const renderCell = (ticket, colId) => {
    switch (colId) {
      case 'clave': {
        const typeConfig = TICKET_TYPE_CONFIG[ticket.ticketType];
        const TypeIcon = typeConfig?.icon;

        return (
          <span className="inline-flex items-center gap-2 font-medium text-slate-900">
            {TypeIcon && (
              <span className="group relative inline-flex" title={typeConfig.label}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${typeConfig.className}`}>
                  <TypeIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {typeConfig.label}
                </span>
              </span>
            )}
            {ticket.id}
          </span>
        );
      }
      case 'summary': return <span className="text-slate-700">{ticket.summary}</span>;
      case 'citizen': return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {ticket.citizen.initials}
          </div>
          <span className="text-slate-700">{ticket.citizen.name}</span>
        </div>
      );
      case 'assignee': return (
        <div className="flex items-center gap-2">
          {ticket.assignee.avatar ? (
            <img 
              src={ticket.assignee.avatar} 
              alt={ticket.assignee.name}
              className="w-6 h-6 rounded-full object-cover" 
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              ?
            </div>
          )}
          <span className="text-slate-700">{ticket.assignee.name}</span>
        </div>
      );
      case 'status': return <StatusBadge status={ticket.status} />;
      case 'createdAt': return <span className="text-slate-500 text-xs">{ticket.createdAt}</span>;
      case 'sla': return (
        <span className="text-xs font-medium">
          {ticket.sla === "-" ? (
            <span className="text-slate-400">-</span>
          ) : ticket.sla.includes("Vencido") ? (
            <span className="text-[#D63031] flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {ticket.sla}
            </span>
          ) : (
            <span className="text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {ticket.sla}
            </span>
          )}
        </span>
      );
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {displayColumns.filter(c => c.visible).map(col => (
              <th key={col.id} className="p-4">{col.label}</th>
            ))}
          </tr>
        </thead>
        <motion.tbody 
          key={tickets.map(t => t.id).join('-')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="divide-y divide-slate-100 text-sm"
        >
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => navigate(`/agente/tickets/${ticket.id}`)}
              className="hover:bg-slate-50 transition-colors cursor-pointer"
              tabIndex={0}
              onKeyDown={(event) => event.key === "Enter" && navigate(`/agente/tickets/${ticket.id}`)}
              aria-label={`Abrir ticket ${ticket.id}: ${ticket.summary}`}
            >
              {displayColumns.filter(c => c.visible).map(col => (
                <td key={col.id} className="p-4">
                  {renderCell(ticket, col.id)}
                </td>
              ))}
            </tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
