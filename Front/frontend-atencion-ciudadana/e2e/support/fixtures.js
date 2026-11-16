// Datos de prueba compartidos por los escenarios E2E.
export const CITIZEN = { id: "c-1", role: "CITIZEN", displayName: "Vecina Uno", email: "vecina@example.test" };
export const AGENT = { id: "a-1", role: "AGENT", displayName: "Agente Uno", email: "agente@example.test" };

export const TICKET = {
  id: "11111111-1111-4111-8111-111111111111",
  publicId: "TK-2026-000101",
  summary: "Luminaria apagada en la cuadra",
  description: "Hace una semana que la luz de la calle no enciende.",
  currentStatus: "ROUTED",
  currentPriority: "MEDIUM",
  createdAt: "2026-11-02T12:00:00Z",
  updatedAt: "2026-11-03T09:30:00Z",
  responsibleAreaId: "M6",
  requestType: { name: "Informar una luminaria apagada" },
  category: { name: "Alumbrado y equipamiento urbano" },
  subcategory: { name: "Alumbrado público" },
  location: { addressLine: "Av. Siempreviva 742" },
  attachments: [],
  ticketActivities: [],
  history: [],
};

export const session = (user) => ({
  status: 200,
  body: { token: `token-${user.role}`, user },
});

// Catálogo mínimo: una categoría → una subcategoría → un tipo de solicitud con un campo propio.
export const CATALOG = {
  category: { id: "cat-1", name: "Alumbrado y equipamiento urbano", description: "Luminarias y equipamiento" },
  subcategory: { id: "sub-1", name: "Alumbrado público", description: "Luminarias de la vía pública" },
  requestType: { id: "rt-1", name: "Informar una luminaria apagada", description: "Avisá de una luz que no funciona", requiresLocation: false },
  form: {
    requestTypeId: "rt-1",
    version: 1,
    fields: [{ code: "numeroLuminaria", label: "Número de luminaria", type: "TEXT", required: true, allowUnknown: false, displayOrder: 1, config: {} }],
  },
};
