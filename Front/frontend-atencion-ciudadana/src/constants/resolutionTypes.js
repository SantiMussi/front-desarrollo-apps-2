// Tipos de resolución del backend (entity ResolutionType).
export const RESOLUTION_TYPES = [
  { value: "ACTION_COMPLETED", label: "Acción completada" },
  { value: "REQUEST_FULFILLED", label: "Solicitud cumplida" },
  { value: "INQUIRY_ANSWERED", label: "Consulta respondida" },
  { value: "ACKNOWLEDGED", label: "Tomado conocimiento" },
  { value: "NO_FURTHER_ACTION_REQUIRED", label: "Sin acción adicional requerida" },
];

export const RESOLUTION_TYPE_LABELS = Object.fromEntries(
  RESOLUTION_TYPES.map((t) => [t.value, t.label])
);

// Simulador interno: respuestas posibles del área responsable. Cada una mapea
// a un ResolutionType y precarga los mensajes de resolución.
export const SIMULATED_AREA_RESPONSES = [
  {
    id: "work-done",
    label: "El área ejecutó el trabajo solicitado",
    type: "ACTION_COMPLETED",
    publicMessage:
      "El área responsable realizó la intervención solicitada. La solicitud fue atendida.",
    internalMessage: "Respuesta simulada del área: trabajo ejecutado y verificado.",
  },
  {
    id: "request-approved",
    label: "El área aprobó y cumplió la solicitud",
    type: "REQUEST_FULFILLED",
    publicMessage:
      "Tu solicitud fue aprobada y resuelta por el área correspondiente.",
    internalMessage: "Respuesta simulada del área: solicitud aprobada y cumplida.",
  },
  {
    id: "inquiry-answered",
    label: "El área respondió la consulta",
    type: "INQUIRY_ANSWERED",
    publicMessage:
      "El área respondió tu consulta. Si necesitás más información, podés generar una nueva solicitud.",
    internalMessage: "Respuesta simulada del área: consulta contestada.",
  },
  {
    id: "acknowledged",
    label: "El área tomó conocimiento",
    type: "ACKNOWLEDGED",
    publicMessage:
      "El área tomó conocimiento de lo informado y lo incorporó a su gestión.",
    internalMessage: "Respuesta simulada del área: tomado conocimiento, sin intervención inmediata.",
  },
  {
    id: "no-action",
    label: "El área determinó que no requiere acción",
    type: "NO_FURTHER_ACTION_REQUIRED",
    publicMessage:
      "El área evaluó el caso y determinó que no requiere una acción adicional.",
    internalMessage: "Respuesta simulada del área: sin acción adicional requerida.",
  },
];
