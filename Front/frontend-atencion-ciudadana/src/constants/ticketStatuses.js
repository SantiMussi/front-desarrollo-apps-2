export const TICKET_STATUS_LABELS = {
  REGISTERED: "Registrado",
  IN_REVIEW: "En revisión",
  ROUTED: "Derivado",
  IN_PROGRESS: "En gestión",
  PENDING_INFORMATION: "Pendiente de información",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
  DUPLICATE: "Duplicado",
  CANCELLED: "Cancelado",
};

// Paleta por estado, reutilizada en la vista del vecino (chips, puntos, barras).
export const STATUS_TONES = {
  blue: { dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700", bar: "bg-blue-400" },
  amber: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700", bar: "bg-amber-400" },
  green: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-400" },
  gray: { dot: "bg-neutral-400", pill: "bg-neutral-100 text-neutral-500", bar: "bg-neutral-300" },
};

export const STATUS_TONE_BY_STATUS = {
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

export const statusTone = (status) =>
  STATUS_TONES[STATUS_TONE_BY_STATUS[status] ?? "gray"];

// Estados terminales: no admiten confirmación / reapertura ni chat abierto.
export const TERMINAL_STATUSES = new Set(["CLOSED", "CANCELLED", "DUPLICATE"]);

// Transiciones de la instancia de confirmación de resolución (vista vecino).
export const CONFIRM_TARGET_STATUS = "CLOSED"; // al confirmar la solución
export const REOPEN_TARGET_STATUS = "IN_PROGRESS"; // al reabrir para retomar tratamiento