import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  answerTicketInformation,
  confirmTicketResolution,
  fetchMyTicketDetail,
  fetchMyTickets,
  submitSatisfactionSurvey,
  reopenTicket,
} from "../services/apiClient";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS } from "../constants/ticketStatuses";
import { reclassificationErrorMessage } from "../utils/reclassification";
import { ACTIVITY_TYPE_LABELS } from "../constants/ticketActivities";
import { useCitizenCancellation } from "./useCitizenCancellation";

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
    mainTicketId: t.mainTicketId ?? null,
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
          purpose: t.pendingInformationRequest.purpose ?? "GENERAL",
          reclassification: t.pendingInformationRequest.reclassification ?? null,
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
  const [storedTicket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const informationInFlight = useRef(false);
  const actionInFlight = useRef(false);
  const generation = useRef(0);
  const request = useRef(0);
  const [loadedId, setLoadedId] = useState(null);
  const ticket = loadedId === publicId ? storedTicket : null;
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async ({ resetActions = false } = {}) => {
    const current = ++request.current;
    const context = generation.current;
    if (resetActions) { setActionLoading(false); setActionError(null); }
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
      if (current !== request.current || context !== generation.current) return;
      const raw = await fetchMyTicketDetail(match.id);
      if (current !== request.current || context !== generation.current) return;
      const data = normalizeTicketDetail(raw, publicId);
      setLoadedId(publicId);
      setTicket(data);
    } catch (err) {
      if (current !== request.current || context !== generation.current) return;
      setLoadedId(publicId);
      setTicket(null);
      setError(messageForLoadError(err));
    } finally {
      if (current === request.current && context === generation.current) setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    let cancelled = false;
    informationInFlight.current = false;
    actionInFlight.current = false;
    (async () => {
      if (!cancelled) await load({ resetActions: true });
    })();
    return () => {
      cancelled = true;
      generation.current += 1;
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
      if (actionInFlight.current) return false;
      actionInFlight.current = true;
      const context = generation.current;
      setActionLoading(true);
      setActionError(null);
      try {
        await apiCall();
        if (context !== generation.current) return false;
        applyLocalTransition(newStatus, actionType, message);
        return true;
      } catch (err) {
        if (context !== generation.current) return false;
        setActionError(messageForActionError(err));
        return false;
      } finally {
        if (context === generation.current) { actionInFlight.current = false; setActionLoading(false); }
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

  const cancellationTicketId = ticket?.id;
  const refreshCancellationTicket = useCallback(async (confirmed) => {
    const context = generation.current;
    if (confirmed?.currentStatus) setTicket((prev) => ({ ...prev, currentStatus: confirmed.currentStatus, statusChangedAt: confirmed.statusChangedAt }));
    const data = normalizeTicketDetail(await fetchMyTicketDetail(cancellationTicketId), publicId);
    if (context !== generation.current) return null;
    setTicket((prev) => prev?.id === cancellationTicketId ? data : prev);
    return data;
  }, [cancellationTicketId, publicId]);
  const cancellation = useCitizenCancellation({ ticket, refreshTicket: refreshCancellationTicket });
  const requestCancel = cancellation.requestCancel;

  const answerInformation = useCallback(
    async (responseMessage, files = [], structured = undefined) => {
      if (!ticket?.id || informationInFlight.current) return false;
      informationInFlight.current = true;
      const context = generation.current;
      setActionLoading(true);
      setActionError(null);
      try {
        const result = await answerTicketInformation(ticket.id, { responseMessage, attachments: files, ...structured });
        if (context !== generation.current) return false;
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
        if (structured) {
          try { const raw = await fetchMyTicketDetail(ticket.id); if (context === generation.current) setTicket(normalizeTicketDetail(raw, publicId)); } catch { /* The accepted response remains reflected locally; reload is still available. */ }
        }
        return true;
      } catch (err) {
        if (context !== generation.current) return false;
        setActionError([409, 410, 422].includes(err.status) ? reclassificationErrorMessage(err) : messageForActionError(err));
        if ([409, 410].includes(err.status)) {
          try { const raw = await fetchMyTicketDetail(ticket.id); if (context === generation.current) setTicket(normalizeTicketDetail(raw, publicId)); } catch { /* Preserve the draft when refresh is unavailable. */ }
        }
        return false;
      } finally {
        if (context === generation.current) { informationInFlight.current = false; setActionLoading(false); }
      }
    },
    [ticket, publicId]
  );

  const rateAttention = useCallback(
    async (score, comment) => {
      if (!ticket?.id || ticket.currentStatus !== "CLOSED") return false;
      if (actionInFlight.current) return false;
      actionInFlight.current = true;
      const context = generation.current;
      setActionLoading(true);
      setActionError(null);
      try {
        await submitSatisfactionSurvey(ticket.id, { score, comment });
        if (context !== generation.current) return false;
        setTicket((prev) => (prev ? { ...prev, rating: score, ratingComment: comment || null } : prev));
        return true;
      } catch (err) {
        if (context !== generation.current) return false;
        setActionError(messageForRatingError(err));
        return false;
      } finally {
        if (context === generation.current) { actionInFlight.current = false; setActionLoading(false); }
      }
    },
    [ticket]
  );

  const actions = useMemo(
    () => ({ confirmResolution, requestReopen, requestCancel, rateAttention, answerInformation }),
    [confirmResolution, requestReopen, requestCancel, rateAttention, answerInformation]
  );

  return { ticket: loadedId === publicId ? ticket : null, loading: loadedId !== publicId || loading, error, actions, cancellation, actionLoading: actionLoading || cancellation.busy, actionError: cancellation.error || actionError, reload: load };
}
