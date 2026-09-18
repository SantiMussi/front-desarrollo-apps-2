import { useCallback, useEffect, useMemo, useState } from "react";
import {
  answerTicketInformation,
  confirmTicketResolution,
  fetchMyTicketDetail,
  fetchMyTickets,
  rateTicketAttention,
  reopenTicket,
} from "../services/apiClient";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS } from "../constants/ticketStatuses";

function buildFallbackHistory(t) {
  if (!t.createdAt) return [];
  const items = [
    { id: "created", actionType: "TICKET_CREATED", newStatus: "REGISTERED", message: "Reclamo creado", occurredAt: t.createdAt },
  ];
  const current = t.currentStatus ?? t.status;
  if (current && current !== "REGISTERED" && t.statusChangedAt) {
    items.push({ id: "current", actionType: "STATE_CHANGED", newStatus: current, message: null, occurredAt: t.statusChangedAt });
  }
  return items;
}

export function normalizeTicketDetail(raw, publicId) {
  const t = raw ?? {};
  return {
    id: t.id ?? null,
    publicId: String(t.publicId ?? t.id ?? publicId),
    currentStatus: t.currentStatus ?? t.status ?? "REGISTERED",
    summary: t.summary ?? "",
    description: t.description ?? "",
    createdAt: t.createdAt ?? null,
    statusChangedAt: t.statusChangedAt ?? t.updatedAt ?? t.createdAt ?? null,
    escalated: t.escalated === true,
    escalationReasonCode: t.escalationReasonCode ?? null,
    escalatedAt: t.escalatedAt ?? null,
    slaNearDue: t.slaNearDue === true,
    slaBreached: t.slaBreached === true,
    resolutionNearDueAt: t.resolutionNearDueAt ?? null,
    resolutionConfirmationDueAt: t.resolutionConfirmationDueAt ?? t.confirmationDueAt ?? null,
    requestType: t.requestType ?? (t.requestTypeName ? { name: t.requestTypeName } : null),
    category: t.category ?? (t.categoryName ? { name: t.categoryName } : null),
    subcategory: t.subcategory ?? (t.subcategoryName ? { name: t.subcategoryName } : null),
    ticketType: t.ticketType ?? null,
    neighborhoodName: t.neighborhoodName ?? t.location?.neighborhood ?? null,
    location: t.location ?? null,
    resolution: t.resolution ?? null,
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
    messages: Array.isArray(t.messages) ? t.messages : [],
    history: Array.isArray(t.history) ? t.history : Array.isArray(t.activities) ? t.activities : buildFallbackHistory(t),
    rating: t.rating ?? null,
  };
}

function messageForLoadError(err) {
  const status = err?.status;
  if (status === 404) return "No encontramos este reclamo.";
  if (status === 403) return "No tenés acceso a este reclamo.";
  if (status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return "No pudimos conectar con el servidor. Intentá de nuevo más tarde.";
}

function messageForActionError(err) {
  const status = err?.status;
  const code = err?.code;
  if (status === 409 || code === "TICKET_RESOLUTION_CONFLICT" || code === "INFORMATION_REQUEST_CONFLICT") {
    return err?.message || "El estado actual del ticket no permite esta acción.";
  }
  if (status === 410 || code === "INFORMATION_REQUEST_EXPIRED") {
    return "El plazo para responder venció.";
  }
  if (status === 403) return "No tenés permiso para realizar esta acción sobre este ticket.";
  if (status === 404) return "No encontramos el ticket.";
  if (status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (status === 400) return err?.message || "Faltan datos obligatorios.";
  return err?.message || "No pudimos completar la acción. Intentá de nuevo.";
}

function messageForRatingError(err) {
  if (err?.status === 404) {
    return "El back todavía no tiene el endpoint para registrar la encuesta — queda preparado para cuando esté listo.";
  }
  return messageForActionError(err);
}

export function useMyTicketDetail(publicId) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchMyTickets({ size: 200 });
      const list = Array.isArray(page?.content) ? page.content : [];
      const match = list.find((t) => String(t.publicId) === String(publicId));
      if (!match) {
        const notFound = new Error("No encontramos ese reclamo.");
        notFound.status = 404;
        throw notFound;
      }
      const raw = await fetchMyTicketDetail(match.id);
      console.log("[useMyTicketDetail] GET /tickets/{id} response:", raw);
      const data = normalizeTicketDetail(raw, publicId);
      setTicket(data);
    } catch (err) {
      setTicket(null);
      setError(messageForLoadError(err));
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
        await apiCall();
        applyLocalTransition(newStatus, actionType, message);
        return true;
      } catch (err) {
        setActionError(messageForActionError(err));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [applyLocalTransition]
  );

  const confirmResolution = useCallback(() => {
    if (!ticket?.id) return Promise.resolve(false);
    return runAction(() => confirmTicketResolution(ticket.id), {
      newStatus: CONFIRM_TARGET_STATUS,
      actionType: "CLOSED",
      message: "El vecino confirmó la resolución. Ticket cerrado.",
    });
  }, [ticket, runAction]);

  const requestReopen = useCallback(
    (reason) => {
      if (!ticket?.id) return Promise.resolve(false);
      return runAction(() => reopenTicket(ticket.id, { reason }), {
        newStatus: REOPEN_TARGET_STATUS,
        actionType: "REOPENED",
        message: `El vecino reabrió el reclamo: "${reason}"`,
      });
    },
    [ticket, runAction]
  );

  const answerInformation = useCallback(
    async (responseMessage) => {
      if (!ticket?.id) return false;
      setActionLoading(true);
      setActionError(null);
      try {
        const result = await answerTicketInformation(ticket.id, { responseMessage });
        const now = result.answeredAt || new Date().toISOString();
        setTicket((prev) =>
          prev
            ? {
              ...prev,
              currentStatus: result.resumeStatus || prev.currentStatus,
              statusChangedAt: now,
              messages: [
                ...prev.messages,
                { id: `info-response-${Date.now()}`, authorType: "CITIZEN", text: responseMessage, createdAt: now },
              ],
              history: [
                ...prev.history,
                { id: `info-response-${Date.now()}`, actionType: "INFORMATION_PROVIDED", newStatus: result.resumeStatus, message: `Respondiste: "${responseMessage}"`, occurredAt: now },
              ],
            }
            : prev
        );
        return true;
      } catch (err) {
        setActionError(messageForActionError(err));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [ticket]
  );

  const rateAttention = useCallback(
    async (stars) => {
      if (!ticket?.id || ticket.currentStatus !== "CLOSED") return false;
      setActionLoading(true);
      setActionError(null);
      try {
        await rateTicketAttention(ticket.id, { stars });
        setTicket((prev) => (prev ? { ...prev, rating: stars } : prev));
        return true;
      } catch (err) {
        setActionError(messageForRatingError(err));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [ticket]
  );

  const actions = useMemo(
    () => ({ confirmResolution, requestReopen, rateAttention, answerInformation }),
    [confirmResolution, requestReopen, rateAttention, answerInformation]
  );

  return { ticket, loading, error, actions, actionLoading, actionError, reload: load };
}
