export const PROGRESS_STEPS = [
  { key: "received", label: "Recibido", statuses: ["REGISTERED"] },
  { key: "review", label: "En revisión", statuses: ["IN_REVIEW"] },
  { key: "work", label: "En marcha", statuses: ["ROUTED", "IN_PROGRESS"] },
  { key: "resolved", label: "Resuelto", statuses: ["RESOLVED"] },
  { key: "closed", label: "Cerrado", statuses: ["CLOSED"] },
];

export const CITIZEN_STATUS_GUIDE = {
  REGISTERED: {
    title: "Recibimos tu reclamo",
    text: "Ya quedó registrado. En breve un agente lo va a revisar; no tenés que hacer nada.",
  },
  IN_REVIEW: {
    title: "Lo estamos revisando",
    text: "Un agente está analizando tu reclamo para decidir qué área lo atiende.",
  },
  ROUTED: {
    title: "Ya lo tiene el área responsable",
    text: "Tu reclamo fue derivado al equipo que corresponde y está por empezar a trabajarse.",
  },
  IN_PROGRESS: {
    title: "Estamos trabajando en esto",
    text: "El equipo ya está gestionando tu reclamo. Si necesitan algo de tu parte, te lo van a pedir acá.",
  },
  PENDING_INFORMATION: {
    title: "Necesitamos un dato tuyo",
    text: "Para seguir adelante nos falta información. Respondé el pedido que aparece más abajo y retomamos enseguida.",
    attention: true,
  },
  RESOLVED: {
    title: "Tu reclamo fue resuelto",
    text: "Revisá la resolución y confirmá si quedó solucionado. Si no, podés reabrirlo.",
    attention: true,
  },
  CLOSED: {
    title: "Reclamo cerrado",
    text: "Terminamos con este reclamo. Gracias por avisarnos.",
  },
  DUPLICATE: {
    title: "Ya estaba reportado",
    text: "Otro vecino informó lo mismo antes. Tu reclamo se siguió junto con ese, así que no hace falta que hagas nada.",
  },
  CANCELLED: {
    title: "Reclamo cancelado",
    text: "Este reclamo fue cancelado y ya no se está gestionando.",
  },
};

// Para PENDING_INFORMATION no sabemos en qué paso estaba: lo tomamos del último estado previo del historial.
export function progressStepIndex(status, history = []) {
  let effective = status;
  if (status === "PENDING_INFORMATION") {
    effective = [...history].reverse().map((h) => h.newStatus).find((s) => s !== "PENDING_INFORMATION") ?? "IN_REVIEW";
  }
  return PROGRESS_STEPS.findIndex((step) => step.statuses.includes(effective));
}
