import { useCallback, useEffect, useRef, useState } from "react";
import {
  trackTicket,
  confirmAnonymousResolution,
  reopenAnonymousTicket,
  answerAnonymousInformation,
  sendAnonymousMessage,
  uploadAnonymousAttachment,
  downloadAnonymousAttachment,
} from "../services/apiClient";
import { reclassificationErrorMessage } from "../utils/reclassification";
import { normalizeTicketDetail } from "./useMyTicketDetail";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS } from "../constants/ticketStatuses";
import { useCitizenCancellation } from "./useCitizenCancellation";

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
  const [storedTicket, setTicket] = useState(null);
  const [accredited, setAccredited] = useState(false);
  const [accrediting, setAccrediting] = useState(false);
  const [accreditError, setAccreditError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const informationInFlight = useRef(false);
  const actionInFlight = useRef(false);
  const generation = useRef(0);
  const [actionError, setActionError] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const password = credentials?.trackingCode === trackingCode ? credentials.password : null;
  const ticket = password ? storedTicket : null;

  const reset = useCallback(() => {
    generation.current += 1;
    informationInFlight.current = false;
    actionInFlight.current = false;
    setTicket(null);
    setAccredited(false);
    setAccrediting(false);
    setAccreditError(null);
    setActionLoading(false);
    setActionError(null);
    setCredentials(null);
  }, []);

  useEffect(() => {
    const current = generation.current;
    Promise.resolve().then(() => { if (current === generation.current) reset(); });
    return () => { generation.current += 1; };
  }, [trackingCode, reset]);

  const revoke = useCallback((err) => {
    if (err?.status === 401) {
      reset();
      setAccreditError(messageForAnonymousActionError(err));
    }
  }, [reset]);

  const accredit = useCallback(
    async (ticketPassword) => {
      reset();
      const current = generation.current;
      setAccrediting(true);
      setAccreditError(null);
      try {
        const response = await trackTicket(trackingCode, ticketPassword);
        if (current !== generation.current) return false;
        setTicket(normalizeTicketDetail(response, response.publicId));
        setAccredited(true);
        setCredentials({ trackingCode, password: ticketPassword });
        return true;
      } catch (err) {
        if (current !== generation.current) return false;
        setAccreditError(messageForAccreditationError(err));
        return false;
      } finally {
        if (current === generation.current) setAccrediting(false);
      }
    },
    [trackingCode, reset]
  );

  const runAction = useCallback(async (apiCall, { newStatus, message }) => {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    const current = generation.current;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiCall();
      if (current !== generation.current) return false;
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
      if (current !== generation.current) return false;
      revoke(err);
      setActionError(messageForAnonymousActionError(err));
      return false;
    } finally {
      if (current === generation.current) { actionInFlight.current = false; setActionLoading(false); }
    }
  }, [revoke]);

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

  const refreshCancellationTicket = useCallback(async (confirmed) => {
    const current = generation.current;
    if (confirmed?.currentStatus) setTicket((prev) => ({ ...prev, currentStatus: confirmed.currentStatus, statusChangedAt: confirmed.statusChangedAt }));
    const raw = await trackTicket(trackingCode, password);
    if (current !== generation.current) return null;
    const data = normalizeTicketDetail(raw, raw.publicId);
    setTicket((prev) => prev?.publicId === data.publicId ? data : prev);
    return data;
  }, [trackingCode, password]);
  const cancellation = useCitizenCancellation({ ticket: password ? ticket : null, refreshTicket: refreshCancellationTicket, trackingCode, password, onUnauthorized: revoke });
  const requestCancel = cancellation.requestCancel;

  const answerInformation = useCallback(
    async (responseMessage, files = [], structured = undefined) => {
      if (!password || !ticket || informationInFlight.current) return false;
      informationInFlight.current = true;
      const current = generation.current;
      setActionLoading(true);
      setActionError(null);
      try {
        const result = await answerAnonymousInformation(trackingCode, {
          ticketPassword: password,
          responseMessage,
          attachments: files,
          ...structured,
        });
        if (current !== generation.current) return false;
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
        if (structured) {
          try { const raw = await trackTicket(trackingCode, password); if (current === generation.current) setTicket(normalizeTicketDetail(raw, raw.publicId)); } catch (err) { if (current === generation.current) revoke(err); }
        }
        return true;
      } catch (err) {
        if (current !== generation.current) return false;
        revoke(err);
        setActionError([409, 410, 422].includes(err.status) ? reclassificationErrorMessage(err) : messageForAnonymousActionError(err));
        if ([409, 410].includes(err.status)) {
          try { const raw = await trackTicket(trackingCode, password); if (current === generation.current) setTicket(normalizeTicketDetail(raw, raw.publicId)); } catch (err) { if (current === generation.current) revoke(err); }
        }
        return false;
      } finally {
        if (current === generation.current) { informationInFlight.current = false; setActionLoading(false); }
      }
    },
    [password, trackingCode, ticket, revoke]
  );

  const actions = { confirmResolution, requestReopen, requestCancel, answerInformation };

  const protectedAttachment = async (call) => {
    if (!password) throw new Error("Falta acreditar el ticket.");
    const current = generation.current;
    try {
      const response = await call();
      if (current !== generation.current) throw new Error("La acreditación cambió.");
      return response;
    } catch (err) { if (current === generation.current) revoke(err); throw err; }
  };

  const attachments = {
    canUpload: Boolean(password && accredited),
    uploadFile: (file) => protectedAttachment(() => uploadAnonymousAttachment(trackingCode, password, file)),
    downloadFile: (attachment) => protectedAttachment(() => downloadAnonymousAttachment(trackingCode, password, attachment.id)),
  };

  // El chat anónimo sólo permite enviar (siempre PUBLIC, sin editar/borrar):
  // el back no expone PATCH/DELETE para /tracking/actions/messages, ni un
  // GET propio — el listado viaja embebido en TrackingTicketResponse.messages
  // (se refresca acá con lo que devuelve el POST, sin volver a pedir todo el
  // ticket).
  const sendMessage = useCallback(
    async (text) => {
      if (!password) throw new Error("No se pudo enviar: falta acreditar el ticket.");
      const current = generation.current;
      let created;
      try { created = await sendAnonymousMessage(trackingCode, { ticketPassword: password, text }); }
      catch (err) { if (current === generation.current) revoke(err); throw err; }
      if (current !== generation.current) throw new Error("La acreditación cambió.");
      setTicket((prev) => (prev ? { ...prev, messages: [...(prev.messages ?? []), created] } : prev));
      return created;
    },
    [password, trackingCode, revoke]
  );



  return {
    ticket: password ? ticket : null,
    accredited: Boolean(password && accredited),
    accrediting,
    accreditError,
    accredit,
    actions,
    cancellation,
    actionLoading: actionLoading || cancellation.busy,
    actionError: cancellation.error || actionError,
    attachments,
    sendMessage,
    messageForError: messageForAnonymousActionError,
    reset,
  };
}
