import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../services/apiClient";
import { cancellationErrorMessage, cancellationReviewRequired } from "../utils/cancellation";

export function useCitizenCancellation({ ticket, refreshTicket, trackingCode, password }) {
  const anonymous = trackingCode !== undefined;
  const id = anonymous ? ticket?.publicId : ticket?.id;
  const enabled = Boolean(id && (!anonymous || password));
  const [state, setState] = useState({ key: null, history: [], loading: true, error: null });
  const [requiresReview, setRequiresReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const historyCall = useCallback(() => anonymous
    ? api.fetchAnonymousCancellationRequests(trackingCode, password)
    : api.fetchCancellationRequests(id), [anonymous, id, trackingCode, password]);

  const loadHistory = useCallback(async () => {
    if (!enabled) return;
    const current = generation.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const history = await historyCall();
      if (!Array.isArray(history)) throw new Error("Invalid cancellation history response");
      if (current === generation.current) setState({ key: id, history, loading: false, error: null });
    } catch (err) {
      if (current === generation.current) setState((prev) => ({ key: id, history: prev.key === id ? prev.history : [], loading: false, error: cancellationErrorMessage(err) }));
    }
  }, [enabled, historyCall, id]);

  useEffect(() => {
    generation.current += 1;
    const current = generation.current;
    Promise.resolve().then(() => {
      if (current !== generation.current) return;
      setRequiresReview(false); setNeedsRefresh(false); setError(null); loadHistory();
    });
    return () => { generation.current += 1; };
  }, [loadHistory]);

  const history = enabled && state.key === id ? state.history : [];
  const pending = history.some((item) => item.status === "PENDING");
  const loading = enabled && (state.key !== id || state.loading);
  const perform = async (payload, direct) => {
    if (!enabled || inFlight.current || loading || state.error || needsRefresh || pending || ticket.currentStatus !== "REGISTERED") return false;
    inFlight.current = true;
    const currentGeneration = generation.current;
    setBusy(true); setError(null);
    try {
      if (direct) {
        const result = anonymous
          ? await api.cancelAnonymousTicket(trackingCode, { ticketPassword: password, reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: payload || null })
          : await api.cancelTicket(id, { reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: payload || null });
        if (currentGeneration !== generation.current) return false;
        // Refresh from the server; a request response must never imply CANCELLED.
        await refreshTicket(result);
      } else {
        if (!payload.reason?.trim()) return false;
        const created = anonymous ? await api.createAnonymousCancellationRequest(trackingCode, password, payload)
          : await api.createCancellationRequest(id, payload);
        if (currentGeneration !== generation.current) return false;
        setState((prev) => ({ ...prev, history: [created, ...prev.history.filter((item) => item.id !== created.id)] }));
        try { await refreshTicket(); } catch (err) { setError(cancellationErrorMessage(err)); }
      }
      await loadHistory();
      return true;
    } catch (err) {
      if (currentGeneration !== generation.current) return false;
      let current = null;
      if (err.status === 409) {
        try { current = await refreshTicket(); } catch { setNeedsRefresh(true); }
        await loadHistory();
      }
      const review = direct && cancellationReviewRequired(err, current);
      if (review) setRequiresReview(true);
      setError(review ? "Este principal tiene duplicados activos. Enviá una solicitud para revisión; el ticket sigue registrado." : cancellationErrorMessage(err));
      return false;
    } finally {
      inFlight.current = false; setBusy(false);
    }
  };
  const reload = async () => {
    setError(null);
    try { await refreshTicket(); await loadHistory(); setNeedsRefresh(false); }
    catch (err) { setError(cancellationErrorMessage(err)); }
  };
  return { history, pending, requiresReview, loading, busy, error: error || (enabled ? state.error : null),
    unavailable: !enabled || loading || busy || Boolean(state.error) || needsRefresh || pending,
    requestCancel: (comment) => perform(comment, true), create: (payload) => perform(payload, false), reload };
}
