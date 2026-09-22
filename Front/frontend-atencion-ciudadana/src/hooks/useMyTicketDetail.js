import { useCallback, useEffect, useMemo, useState } from "react";
import {
  answerTicketInformation,
  cancelTicket,
  confirmTicketResolution,
  fetchMyTicketDetail,
  fetchMyTickets,
  submitSatisfactionSurvey,
  reopenTicket,
} from "../services/apiClient";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS } from "../constants/ticketStatuses";
import { ACTIVITY_TYPE_LABELS } from "../constants/ticketActivities";

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

function mapTicketActivities(activities) {
  return activities.map((activity) => ({
    id: `activity-${activity.sequence}`,
    actionType: activity.actionType,
    newStatus: activity.newStatus,
    message: activity.message || ACTIVITY_TYPE_LABELS[activity.actionType] || null,
    occurredAt: activity.occurredAt,
  }));
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
    // Sólo viene poblado en la respuesta de tracking (ticket anónimo, PUBLIC
    // únicamente) — el detalle de ticket identificado no trae este campo,
    // ese caso usa el chat real vía useTicketMessages en su lugar.
    messages: Array.isArray(t.messages) ? t.messages : [],
    pendingInformationRequest: t.pendingInformationRequest
      ? {
          status: t.pendingInformationRequest.status,
          messageForCitizen: t.pendingInformationRequest.messageForCitizen,
          requestedAt: t.pendingInformationRequest.requestedAt,
          dueAt: t.pendingInformationRequest.dueAt,
          attachments: Array.isArray(t.pendingInformationRequest.attachments)
            ? t.pendingInformationRequest.attachments
            : [],
        }
      : null,
    history: Array.isArray(t.ticketActivities)
      ? mapTicketActivities(t.ticketActivities)
      : Array.isArray(t.history)
        ? t.history
        : Array.isArray(t.activities)
          ? t.activities
          : buildFallbackHistory(t),
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
  if (err?.status === 409) return err?.message || "Ya enviaste una encuesta de satisfacción para este ticket.";
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

  const requestCancel = useCallback(
    (comment) => {
      if (!ticket?.id) return Promise.resolve(false);
      return runAction(
        () => cancelTicket(ticket.id, { reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: comment || null }),
        {
          newStatus: "CANCELLED",
          actionType: "CANCELLED",
          message: comment ? `El vecino canceló el reclamo: "${comment}"` : "El vecino canceló el reclamo.",
        }
      );
    },
    [ticket, runAction]
  );

  const answerInformation = useCallback(
    async (responseMessage, files = []) => {
      if (!ticket?.id) return false;
      setActionLoading(true);
      setActionError(null);
      try {
        const result = await answerTicketInformation(ticket.id, { responseMessage, attachments: files });
        const now = result.answeredAt || new Date().toISOString();
        setTicket((prev) =>
          prev
            ? {
              ...prev,
              currentStatus: result.currentStatus || prev.currentStatus,
              statusChangedAt: now,
              pendingInformationRequest: null,
              history: [
                ...prev.history,
                { id: `info-response-${Date.now()}`, actionType: "INFORMATION_PROVIDED", newStatus: result.currentStatus, message: `Respondiste: "${responseMessage}"`, occurredAt: now },
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
    async (score, comment) => {
      if (!ticket?.id || ticket.currentStatus !== "CLOSED") return false;
      setActionLoading(true);
      setActionError(null);
      try {
        await submitSatisfactionSurvey(ticket.id, { score, comment });
        setTicket((prev) => (prev ? { ...prev, rating: score, ratingComment: comment || null } : prev));
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
    () => ({ confirmResolution, requestReopen, requestCancel, rateAttention, answerInformation }),
    [confirmResolution, requestReopen, requestCancel, rateAttention, answerInformation]
  );

  return { ticket, loading, error, actions, actionLoading, actionError, reload: load };
}
