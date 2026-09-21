import { useCallback, useState } from "react";
import {
  trackTicket,
  confirmAnonymousResolution,
  reopenAnonymousTicket,
  answerAnonymousInformation,
  rateAnonymousTicketAttention,
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
  if (err?.status === 404) {
    return "El back todavía no tiene este endpoint para tickets anónimos — queda preparado para cuando esté listo.";
  }
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
                messages: [
                  ...prev.messages,
                  { id: `info-response-${Date.now()}`, authorType: "CITIZEN", text: responseMessage, createdAt: now },
                ],
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

  const actions = { confirmResolution, requestReopen, answerInformation, rateAttention };

  const attachments = {
    canUpload: true,
    uploadFile: (file) => uploadAnonymousAttachment(trackingCode, password, file),
    downloadFile: (attachment) => downloadAnonymousAttachment(trackingCode, password, attachment.id),
  };

  const reset = useCallback(() => {
    setTicket(null);
    setAccredited(false);
    setAccrediting(false);
    setAccreditError(null);
    setActionLoading(false);
    setActionError(null);
    setPassword(null);
  }, []);

  return { ticket, accredited, accrediting, accreditError, accredit, actions, actionLoading, actionError, attachments, reset };
}
