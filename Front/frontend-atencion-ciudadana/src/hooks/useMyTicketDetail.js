import { useCallback, useEffect, useMemo, useState } from "react";
import {
  confirmTicketResolution,
  fetchMyTicketDetail,
  rateTicketAttention,
  reopenTicket,
} from "../services/apiClient";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS } from "../constants/ticketStatuses";

// Placeholder de foto (data URI) — se reemplaza por attachment.url cuando el back lo provea.
const photo = (label, from, to) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="480" height="360" fill="url(#g)"/><text x="50%" y="52%" font-family="system-ui,Arial" font-size="22" fill="#ffffffcc" text-anchor="middle">${label}</text></svg>`
  )}`;

// ── Datos de ejemplo (mientras no existe GET /api/tickets/mine/{publicId}) ──
// La forma imita la respuesta esperada del back para que conectar sea directo.
const SAMPLE_DETAILS = {
  "OP-0000012298": {
    publicId: "OP-0000012298",
    currentStatus: "RESOLVED",
    summary: "Bache en la vía pública",
    description:
      "Hay un bache profundo en la intersección de Av. San Juan y Lima que está causando problemas al tráfico y peligro para los ciclistas. Se ha ido agrandando con las últimas lluvias.",
    createdAt: "2026-10-12T12:30:00Z",
    statusChangedAt: "2026-10-15T17:45:00Z",
    resolutionConfirmationDueAt: "2026-10-22T17:45:00Z",
    requestType: { name: "Informar un bache" },
    category: { name: "Mantenimiento Vial" },
    subcategory: { name: "Calles y Pavimento" },
    location: { addressLine: "Av. San Juan & Lima", neighborhood: "Monserrat", district: "Comuna 1" },
    resolution: {
      type: "ACTION_COMPLETED",
      publicMessage:
        "El bache ha sido reparado en el día de la fecha. Por favor, confirmá si la solución es satisfactoria. ¡Gracias por tu reporte!",
      resolvedAt: "2026-10-15T17:45:00Z",
    },
    attachments: [
      { id: "a1", name: "bache-esquina.jpg", url: photo("Foto del reporte", "#5b6b7a", "#2f3b47") },
      { id: "a2", name: "bache-detalle.jpg", url: photo("Foto del reporte", "#6a5c4a", "#3a3126") },
    ],
    messages: [
      {
        id: "m1",
        authorType: "CITIZEN",
        text: "Buenos días, adjunté las fotos solicitadas sobre el bache. ¿Tienen un estimado de cuándo podrían repararlo?",
        createdAt: "2026-10-13T13:00:00Z",
      },
      {
        id: "m2",
        authorType: "AGENT",
        authorName: "Atención Vecinal",
        text: "Hola. Recibimos la información correctamente. La cuadrilla está programada para la zona esta semana. Te mantendremos informado.",
        createdAt: "2026-10-13T14:20:00Z",
      },
      {
        id: "m3",
        authorType: "AGENT",
        authorName: "Atención Vecinal",
        text: "El bache ha sido reparado en el día de la fecha. Por favor, confirmá si la solución es satisfactoria. ¡Gracias por tu reporte!",
        createdAt: "2026-10-15T17:45:00Z",
      },
    ],
    history: [
      { id: "h1", actionType: "TICKET_CREATED", newStatus: "REGISTERED", message: "Reclamo creado", occurredAt: "2026-10-12T12:30:00Z" },
      { id: "h2", actionType: "REVIEW_STARTED", newStatus: "IN_REVIEW", message: "Asignado a Cuadrilla Vial Centro", occurredAt: "2026-10-13T14:15:00Z" },
      { id: "h3", actionType: "RESOLVED", newStatus: "RESOLVED", message: "Reparación completada", occurredAt: "2026-10-15T17:45:00Z" },
    ],
    rating: null,
  },
  "OP-0000012340": {
    publicId: "OP-0000012340",
    currentStatus: "IN_PROGRESS",
    summary: "Poda de árbol peligroso",
    description:
      "Las ramas están tocando los cables de tensión en la plaza principal. Con viento fuerte golpean contra el balcón del primer piso.",
    createdAt: "2026-10-05T12:00:00Z",
    statusChangedAt: "2026-10-08T09:30:00Z",
    resolutionConfirmationDueAt: null,
    requestType: { name: "Solicitar poda" },
    category: { name: "Arbolado, plazas y espacios verdes" },
    subcategory: { name: "Arbolado público" },
    location: { addressLine: "Yerbal 2400", neighborhood: "Flores", district: "Comuna 7" },
    resolution: null,
    attachments: [],
    messages: [
      {
        id: "m1",
        authorType: "AGENT",
        authorName: "Atención Vecinal",
        text: "Derivamos el pedido al área de Arbolado. Te avisamos cuando la cuadrilla tenga fecha.",
        createdAt: "2026-10-08T09:35:00Z",
      },
    ],
    history: [
      { id: "h1", actionType: "TICKET_CREATED", newStatus: "REGISTERED", message: "Reclamo creado", occurredAt: "2026-10-05T12:00:00Z" },
      { id: "h2", actionType: "REVIEW_STARTED", newStatus: "IN_REVIEW", message: "En revisión", occurredAt: "2026-10-06T10:00:00Z" },
      { id: "h3", actionType: "STATE_CHANGED", newStatus: "IN_PROGRESS", message: "Cuadrilla asignada", occurredAt: "2026-10-08T09:30:00Z" },
    ],
    rating: null,
  },
  "OP-0000012345": {
    publicId: "OP-0000012345",
    currentStatus: "REGISTERED",
    summary: "Luminaria apagada en la cuadra",
    description: "Hace una semana que la luz de la calle no enciende, frente al número 123.",
    createdAt: "2026-10-10T12:00:00Z",
    statusChangedAt: "2026-10-10T12:00:00Z",
    resolutionConfirmationDueAt: null,
    requestType: { name: "Informar una luminaria apagada" },
    category: { name: "Alumbrado y equipamiento urbano" },
    subcategory: { name: "Alumbrado público" },
    location: { addressLine: "Av. Rivadavia 6100", neighborhood: "Caballito", district: "Comuna 6" },
    resolution: null,
    attachments: [],
    messages: [],
    history: [
      { id: "h1", actionType: "TICKET_CREATED", newStatus: "REGISTERED", message: "Reclamo creado", occurredAt: "2026-10-10T12:00:00Z" },
    ],
    rating: null,
  },
};

function sampleFor(publicId) {
  const base = SAMPLE_DETAILS[publicId];
  if (base) return JSON.parse(JSON.stringify(base));
  // Fallback genérico para cualquier otro id.
  return {
    publicId,
    currentStatus: "IN_REVIEW",
    summary: "Reclamo",
    description: "Detalle no disponible en los datos de ejemplo.",
    createdAt: new Date().toISOString(),
    statusChangedAt: new Date().toISOString(),
    resolutionConfirmationDueAt: null,
    requestType: null,
    category: null,
    subcategory: null,
    location: null,
    resolution: null,
    attachments: [],
    messages: [],
    history: [
      { id: "h1", actionType: "TICKET_CREATED", newStatus: "REGISTERED", message: "Reclamo creado", occurredAt: new Date().toISOString() },
    ],
    rating: null,
  };
}

function normalize(raw, publicId) {
  const t = raw ?? {};
  return {
    publicId: String(t.publicId ?? t.id ?? publicId),
    currentStatus: t.currentStatus ?? t.status ?? "REGISTERED",
    summary: t.summary ?? "",
    description: t.description ?? "",
    createdAt: t.createdAt ?? null,
    statusChangedAt: t.statusChangedAt ?? t.updatedAt ?? t.createdAt ?? null,
    resolutionConfirmationDueAt: t.resolutionConfirmationDueAt ?? t.confirmationDueAt ?? null,
    requestType: t.requestType ?? null,
    category: t.category ?? null,
    subcategory: t.subcategory ?? null,
    location: t.location ?? null,
    resolution: t.resolution ?? null,
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
    messages: Array.isArray(t.messages) ? t.messages : [],
    history: Array.isArray(t.history) ? t.history : Array.isArray(t.activities) ? t.activities : [],
    rating: t.rating ?? null,
  };
}

const isBackendMissing = (err) => [401, 403, 404].includes(err?.status);

/**
 * Detalle del reclamo del vecino + acciones de confirmación / reapertura.
 *
 * Mientras el back no exponga los endpoints, usa datos de ejemplo y aplica las
 * transiciones localmente (optimista) para poder demostrar el flujo. Cuando el
 * back esté listo, las acciones ya llaman al endpoint correcto y solo hay que
 * quitar los fallbacks locales.
 */
export function useMyTicketDetail(publicId) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("sample");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = normalize(await fetchMyTicketDetail(publicId), publicId);
      setTicket(data);
      setSource("backend");
    } catch (err) {
      setTicket(normalize(sampleFor(publicId), publicId));
      setSource("sample");
      if (err?.status && !isBackendMissing(err)) {
        setError(err.message ?? "No pudimos cargar el detalle del reclamo.");
      }
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Aplica una transición al estado local + agrega entrada al historial.
  const applyLocalTransition = useCallback((newStatus, actionType, message) => {
    const now = new Date().toISOString();
    setTicket((prev) =>
      prev
        ? {
            ...prev,
            currentStatus: newStatus,
            statusChangedAt: now,
            history: [
              ...prev.history,
              { id: `local-${Date.now()}`, actionType, newStatus, message, occurredAt: now },
            ],
          }
        : prev
    );
  }, []);

  const runAction = useCallback(
    async (apiCall, { newStatus, actionType, message }) => {
      setActionLoading(true);
      setActionError(null);
      try {
        const updated = await apiCall();
        if (updated && typeof updated === "object") {
          setTicket(normalize(updated, publicId));
        } else {
          applyLocalTransition(newStatus, actionType, message);
        }
        return true;
      } catch (err) {
        if (isBackendMissing(err)) {
          // Endpoint todavía inexistente → simulamos la transición localmente.
          applyLocalTransition(newStatus, actionType, message);
          return true;
        }
        setActionError(err?.message ?? "No pudimos completar la acción. Intentá de nuevo.");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [applyLocalTransition, publicId]
  );

  const confirmResolution = useCallback(
    () =>
      runAction(() => confirmTicketResolution(publicId), {
        newStatus: CONFIRM_TARGET_STATUS,
        actionType: "CLOSED",
        message: "El vecino confirmó la resolución. Ticket cerrado.",
      }),
    [publicId, runAction]
  );

  const requestReopen = useCallback(
    (reason) =>
      runAction(() => reopenTicket(publicId, { reason }), {
        newStatus: REOPEN_TARGET_STATUS,
        actionType: "REOPENED",
        message: reason
          ? `El vecino reabrió el reclamo: "${reason}"`
          : "El vecino indicó que el problema continúa. Reclamo reabierto.",
      }),
    [publicId, runAction]
  );

  const rateAttention = useCallback(
    async (stars) => {
      setTicket((prev) => (prev ? { ...prev, rating: stars } : prev));
      try {
        await rateTicketAttention(publicId, stars);
      } catch {
        /* nice-to-have: si falla, la calificación local igual queda */
      }
    },
    [publicId]
  );

  const actions = useMemo(
    () => ({ confirmResolution, requestReopen, rateAttention }),
    [confirmResolution, requestReopen, rateAttention]
  );

  return { ticket, loading, error, source, actions, actionLoading, actionError, reload: load };
}
