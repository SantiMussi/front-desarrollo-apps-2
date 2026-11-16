export const MOCK_AGENTS = [
  { id: 1, name: "Laura Martínez", email: "lmartinez@ciudaduade.gob.ar", initials: "LM", status: "available", area: "Obras Públicas", activeTickets: 4, capacity: 10, sla: 98.5, resolvedThisMonth: 46, color: "bg-violet-100 text-violet-700" },
  { id: 2, name: "Nicolás Fernández", email: "nfernandez@ciudaduade.gob.ar", initials: "NF", status: "busy", area: "Higiene Urbana", activeTickets: 8, capacity: 10, sla: 94.2, resolvedThisMonth: 39, color: "bg-blue-100 text-blue-700" },
  { id: 3, name: "Sofía Benítez", email: "sbenitez@ciudaduade.gob.ar", initials: "SB", status: "available", area: "Espacios Verdes", activeTickets: 3, capacity: 10, sla: 99.1, resolvedThisMonth: 52, color: "bg-emerald-100 text-emerald-700" },
  { id: 4, name: "Matías Gómez", email: "mgomez@ciudaduade.gob.ar", initials: "MG", status: "away", area: "Tránsito", activeTickets: 6, capacity: 10, sla: 91.8, resolvedThisMonth: 31, color: "bg-amber-100 text-amber-700" },
  { id: 5, name: "Camila Rodríguez", email: "crodriguez@ciudaduade.gob.ar", initials: "CR", status: "available", area: "Obras Públicas", activeTickets: 5, capacity: 10, sla: 97.3, resolvedThisMonth: 44, color: "bg-rose-100 text-rose-700" },
  { id: 6, name: "Diego Álvarez", email: "dalvarez@ciudaduade.gob.ar", initials: "DA", status: "offline", area: "Alumbrado Público", activeTickets: 0, capacity: 10, sla: 96.4, resolvedThisMonth: 28, color: "bg-slate-200 text-slate-700" },
  { id: 7, name: "Valentina Ruiz", email: "vruiz@ciudaduade.gob.ar", initials: "VR", status: "busy", area: "Atención General", activeTickets: 9, capacity: 10, sla: 89.6, resolvedThisMonth: 37, color: "bg-cyan-100 text-cyan-700" },
];

export const AGENT_STATUS = {
  available: { label: "Disponible", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  busy: { label: "Ocupado", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  away: { label: "Ausente", dot: "bg-blue-400", badge: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  offline: { label: "Desconectado", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};