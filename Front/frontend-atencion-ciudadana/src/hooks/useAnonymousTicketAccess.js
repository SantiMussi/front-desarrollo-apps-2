import { useCallback, useState } from "react";
import {
  trackTicket,
  cancelAnonymousTicket,
  confirmAnonymousResolution,
  reopenAnonymousTicket,
  answerAnonymousInformation,
  rateAnonymousTicketAttention,
  sendAnonymousMessage,
  uploadAnonymousAttachment,
  downloadAnonymousAttachment,
} from "../services/apiClient";
import { normalizeTicketDetail } from "./useMyTicketDetail";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS } from "../constants/ticketStatuses";

function messageForAccreditationError(err) {
  if (err?.status === 401) return "La contraseña ingresada no es correcta.";
  if (err?.status === 404) return "No encontramos ese ticket.";
  return err?.message || "No pudimos validar la contraseña. Intentá de nuevo.";
}

function messageForAnonymousActionError(err) {
  if (err?.status === 404) return "No encontramos ese ticket.";
  if (err?.status === 401) return "La contraseña ya no acredita este ticket. Volvé a ingresarla.";
  if (err?.status === 409) return err?.message || "El estado actual del ticket no permite esta acción.";
  if (err?.status === 400) return err?.message || "Faltan datos obligatorios.";
  return err?.message || "No pudimos completar la acción. Intentá de nuevo.";
}

export function useAnonymousTicketAccess(trackingCode) {
  const [ticket, setTicket] = useState(null);
  const [accredited, setAccredited] = useState(false);
  const [accrediting, setAccrediting] = useState(false);
  const [accreditError, setAccreditError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [password, setPassword] = useState(null);

  const accredit = useCallback(
    async (ticketPassword) => {
      setAccrediting(true);
      setAccreditError(null);
      try {
        const response = await trackTicket(trackingCode, ticketPassword);
        console.log("[QA] Respuesta cruda de POST /tracking/access (fijate que no trae 'attachments'):", response);
        setTicket(normalizeTicketDetail(response, response.publicId));
        setAccredited(true);
        setPassword(ticketPassword);
        return true;
      } catch (err) {
        setAccreditError(messageForAccreditationError(err));
        return false;
      } finally {
        setAccrediting(false);
      }
    },
    [trackingCode]
  );

  const runAction = useCallback(async (apiCall, { newStatus, message }) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiCall();
      const now = new Date().toISOString();
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              currentStatus: newStatus ?? prev.currentStatus,
              statusChangedAt: now,
              history: [
                ...prev.history,
                { id: `local-${Date.now()}`, newStatus: newStatus ?? prev.currentStatus, message, occurredAt: now },
              ],
            }
          : prev
      );
      return true;
    } catch (err) {
      setActionError(messageForAnonymousActionError(err));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const confirmResolution = useCallback(() => {
    if (!password) return Promise.resolve(false);
    return runAction(() => confirmAnonymousResolution(trackingCode, password), {
      newStatus: CONFIRM_TARGET_STATUS,
      message: "Confirmaste la resolución. Ticket cerrado.",
    });
  }, [password, trackingCode, runAction]);

  const requestReopen = useCallback(
    (reason) => {
      if (!password) return Promise.resolve(false);
      return runAction(() => reopenAnonymousTicket(trackingCode, { ticketPassword: password, reason }), {
        newStatus: REOPEN_TARGET_STATUS,
        message: `Reabriste el reclamo: "${reason}"`,
      });
    },
    [password, trackingCode, runAction]
  );

  const requestCancel = useCallback(
    (comment) => {
      if (!password) return Promise.resolve(false);
      return runAction(
        () => cancelAnonymousTicket(trackingCode, { ticketPassword: password, reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: comment || null }),
        {
          newStatus: "CANCELLED",
          message: comment ? `Cancelaste el reclamo: "${comment}"` : "Cancelaste el reclamo.",
        }
      );
    },
    [password, trackingCode, runAction]
  );

  const answerInformation = useCallback(
    async (responseMessage, files = []) => {
      if (!password || !ticket) return false;
      setActionLoading(true);
      setActionError(null);
      try {
        const result = await answerAnonymousInformation(trackingCode, {
          ticketPassword: password,
          responseMessage,
          attachments: files,
        });
        const now = result?.answeredAt || new Date().toISOString();
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                currentStatus: result?.currentStatus || prev.currentStatus,
                statusChangedAt: now,
                pendingInformationRequest: null,
                history: [
                  ...prev.history,
                  {
                    id: `info-response-${Date.now()}`,
                    newStatus: result?.currentStatus,
                    message: `Respondiste: "${responseMessage}"`,
                    occurredAt: now,
                  },
                ],
              }
            : prev
        );
        return true;
      } catch (err) {
        setActionError(messageForAnonymousActionError(err));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [password, trackingCode, ticket]
  );

  const rateAttention = useCallback(
    async (stars) => {
      if (!password || ticket?.currentStatus !== "CLOSED") return false;
      setActionLoading(true);
      setActionError(null);
      try {
        await rateAnonymousTicketAttention(trackingCode, { ticketPassword: password, stars });
        setTicket((prev) => (prev ? { ...prev, rating: stars } : prev));
        return true;
      } catch (err) {
        setActionError(messageForAnonymousActionError(err));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [password, trackingCode, ticket]
  );

  const actions = { confirmResolution, requestReopen, requestCancel, answerInformation, rateAttention };

  const attachments = {
    canUpload: true,
    uploadFile: (file) => uploadAnonymousAttachment(trackingCode, password, file),
    downloadFile: (attachment) => downloadAnonymousAttachment(trackingCode, password, attachment.id),
  };

  // El chat anónimo sólo permite enviar (siempre PUBLIC, sin editar/borrar):
  // el back no expone PATCH/DELETE para /tracking/actions/messages, ni un
  // GET propio — el listado viaja embebido en TrackingTicketResponse.messages
  // (se refresca acá con lo que devuelve el POST, sin volver a pedir todo el
  // ticket).
  const sendMessage = useCallback(
    async (text) => {
      if (!password) throw new Error("No se pudo enviar: falta acreditar el ticket.");
      const created = await sendAnonymousMessage(trackingCode, { ticketPassword: password, text });
      setTicket((prev) => (prev ? { ...prev, messages: [...(prev.messages ?? []), created] } : prev));
      return created;
    },
    [password, trackingCode]
  );

  const reset = useCallback(() => {
    setTicket(null);
    setAccredited(false);
    setAccrediting(false);
    setAccreditError(null);
    setActionLoading(false);
    setActionError(null);
    setPassword(null);
  }, []);

  return {
    ticket,
    accredited,
    accrediting,
    accreditError,
    accredit,
    actions,
    actionLoading,
    actionError,
    attachments,
    sendMessage,
    messageForError: messageForAnonymousActionError,
    reset,
  };
}
