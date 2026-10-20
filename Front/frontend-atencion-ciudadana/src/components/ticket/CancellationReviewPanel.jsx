import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../services/apiClient";
import { cancellationErrorMessage, CANCELLATION_STATUS_LABELS } from "../../utils/cancellation";
import CancellationHistory from "./CancellationHistory";

const inputClass = "mt-1 block w-full rounded border border-slate-300 bg-white p-2";

export default function CancellationReviewPanel({ ticket, readOnly, onRefresh, onBusyChange }) {
  const [data, setData] = useState({ requests: [], conflicts: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState("");
  const [scope, setScope] = useState("");
  const [reason, setReason] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [family, setFamily] = useState([]);
  const familyIds = useRef(new Set());
  const inFlight = useRef(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const current = generation.current;
    setLoading(true); setLoadError(null);
    try {
      const [requests, conflicts] = await Promise.all([
        api.fetchStaffCancellationRequests(ticket.id), api.fetchCancellationConflicts(ticket.id),
      ]);
      if (current === generation.current) {
        setData({ requests, conflicts });
        setSelected((previous) => {
          if (!previous) return null;
          const item = (previous.conflict ? conflicts : requests).find((entry) => entry.id === previous.item.id);
          return item ? { ...previous, item } : null;
        });
      }
    } catch (err) {
      if (current === generation.current) setLoadError(cancellationErrorMessage(err));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [ticket.id]);
  useEffect(() => {
    generation.current += 1;
    Promise.resolve().then(load);
    return () => { generation.current += 1; };
  }, [load, ticket]);

  // No family endpoint or mainTicketId filter exists. Use the existing paged
  // DUPLICATE inbox and authorized details, and retain IDs across the decision.
  const loadFamily = async () => {
    const related = new Map();
    let page = 0;
    let last;
    do {
      const result = await api.fetchAgentTickets({ status: "DUPLICATE", page, size: 200, sort: "id,asc" });
      const details = await Promise.all(result.content.map((item) => api.fetchStaffTicketDetail(item.id)));
      details.filter((item) => item.mainTicketId === ticket.id).forEach((item) => {
        familyIds.current.add(item.id); related.set(item.id, item);
      });
      last = result.last || page + 1 >= result.totalPages;
      page += 1;
    } while (!last);
    const refreshed = await Promise.all([...familyIds.current].map((id) => api.fetchStaffTicketDetail(id)));
    refreshed.forEach((item) => related.set(item.id, item));
    setFamily([...related.values()]);
  };
  const refresh = async (withFamily = false) => {
    await onRefresh();
    await load();
    if (withFamily || familyIds.current.size) await loadFamily();
  };
  const run = async (operation) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); onBusyChange(true); setError(null);
    try { await operation(); }
    catch (err) { setError(cancellationErrorMessage(err)); }
    finally { inFlight.current = false; setBusy(false); onBusyChange(false); }
  };
  const choose = (item, conflict) => run(async () => {
    const detail = conflict ? item : await api.fetchStaffCancellationRequest(ticket.id, item.id);
    setSelected({ item: detail, conflict });
    setDecision(""); setScope(""); setReason(""); setPublicMessage(""); setConfirmed(false);
  });
  const submit = async (event) => {
    event.preventDefault();
    if (readOnly || loading || loadError || !selected || !reason.trim() || !decision
      || (decision === "APPROVED" && (!scope || !confirmed))) return;
    await run(async () => {
      const payload = { decisionReason: reason.trim(), ...(decision === "APPROVED" ? { cancellationScope: scope, ...(publicMessage.trim() ? { publicMessage: publicMessage.trim() } : {}) } : {}) };
      try {
        // Capture actual IDs before promotion; the review response is not a family.
        if (decision === "APPROVED") await loadFamily();
        if (selected.conflict) await api.resolveCancellationConflict(ticket.id, selected.item.id, { decision, ...payload });
        else if (decision === "APPROVED") await api.approveCancellationRequest(ticket.id, selected.item.id, payload);
        else await api.rejectCancellationRequest(ticket.id, selected.item.id, payload);
      } catch (err) {
        if (err.status === 409 || err.status === 403) await refresh();
        throw err;
      }
      setSelected(null);
      await refresh(decision === "APPROVED");
    });
  };
  const unavailable = readOnly || busy || loading || Boolean(loadError);
  return <section aria-label="Revisión de cancelaciones" className="space-y-3 text-xs">
    <p>Estado efectivo del ticket: <strong>{ticket.currentStatus}</strong>. Una revisión pendiente no implica cancelación.</p>
    <button type="button" disabled={busy || loading} onClick={() => run(() => refresh())} className="underline">Actualizar revisiones y ticket</button>
    {loading && <p>Cargando revisiones…</p>}
    {loadError && <p role="alert" className="text-red-700">{loadError}</p>}
    {readOnly && <p>Vista de lectura: no se permiten decisiones sobre tickets propios o sin autorización verificada.</p>}
    <h3 className="font-semibold">Solicitudes ciudadanas</h3>
    {!loading && !data.requests.length && <p>Sin solicitudes.</p>}
    {data.requests.map((item) => <div key={item.id}>
      <CancellationHistory items={[item]} staff />
      <button type="button" disabled={busy || loading} onClick={() => choose(item, false)} className="my-2 underline">Ver solicitud {item.id}</button>
    </div>)}
    <h3 className="font-semibold">Conflictos administrativos</h3>
    {!loading && !data.conflicts.length && <p>Sin conflictos.</p>}
    {data.conflicts.map((item) => <div key={item.id} className="rounded border border-amber-200 p-3">
      <p className="font-semibold">{item.origin} · {CANCELLATION_STATUS_LABELS[item.status]} ({item.status})</p>
      <p>Motivo: {item.reasonCode} · {new Date(item.occurredAt).toLocaleString("es-AR")}</p>
      {item.publicMessage && <p>Información pública: {item.publicMessage}</p>}
      {item.internalMessage && <p>Información interna: {item.internalMessage}</p>}
      {item.cancellationScope && <p>Alcance aplicado: {item.cancellationScope}</p>}
      {item.decisionReason && <p>Justificación interna: {item.decisionReason}</p>}
      <button type="button" disabled={unavailable || item.status !== "PENDING"} onClick={() => choose(item, true)} className="mt-2 underline">Revisar conflicto {item.id}</button>
    </div>)}
    {selected && <div className="rounded border border-slate-300 p-3">
      <p className="font-semibold">Detalle {selected.item.id} · {CANCELLATION_STATUS_LABELS[selected.item.status]}</p>
      {!selected.conflict && <CancellationHistory items={[selected.item]} staff />}
      {selected.item.status === "PENDING" && !readOnly && <form onSubmit={submit} className="mt-2 space-y-3">
        <label className="block">Decisión administrativa<select aria-label="Decisión administrativa" required value={decision} disabled={unavailable} onChange={(event) => { setDecision(event.target.value); setConfirmed(false); }} className={inputClass}>
          <option value="">Seleccionar…</option><option value="APPROVED">Aprobar cancelación</option><option value="REJECTED">Rechazar cancelación</option>
        </select></label>
        {decision === "APPROVED" && <>
          <label className="block">Alcance<select aria-label="Alcance" required value={scope} disabled={unavailable} onChange={(event) => { setScope(event.target.value); setConfirmed(false); }} className={inputClass}>
            <option value="">Seleccionar alcance…</option><option value="GLOBAL">GLOBAL</option><option value="PRINCIPAL_ONLY">PRINCIPAL_ONLY</option>
          </select></label>
          <p>GLOBAL cancela el principal y todos sus duplicados activos.</p>
          <p>PRINCIPAL_ONLY cancela sólo el principal, promueve el duplicado activo más antiguo a IN_REVIEW y vincula los restantes al nuevo principal.</p>
          <label className="block">Mensaje público (opcional)<textarea value={publicMessage} maxLength={4000} disabled={unavailable} onChange={(event) => setPublicMessage(event.target.value)} className={inputClass} /></label>
          <label className="block"><input type="checkbox" checked={confirmed} disabled={unavailable || !scope} onChange={(event) => setConfirmed(event.target.checked)} /> Confirmo el alcance y sus consecuencias sobre los ciudadanos de la familia.</label>
        </>}
        <label className="block">Justificación interna obligatoria<textarea required value={reason} maxLength={4000} disabled={unavailable} onChange={(event) => setReason(event.target.value)} className={inputClass} /></label>
        <p>Una solicitud desactualizada no puede aprobarse; se puede rechazar con justificación.</p>
        <button type="submit" disabled={unavailable || !decision || !reason.trim() || (decision === "APPROVED" && (!scope || !confirmed))} className="rounded bg-[#0F2C59] px-3 py-2 text-white disabled:opacity-50">Confirmar decisión</button>
      </form>}
      <button type="button" disabled={busy} onClick={() => setSelected(null)} className="mt-2 underline">Cerrar detalle de revisión</button>
    </div>}
    <button type="button" disabled={busy || loading} onClick={() => run(loadFamily)} className="underline">Consultar familia vinculada</button>
    {family.length > 0 && <ul aria-label="Familia actualizada" className="space-y-2">{family.map((item) => <li key={item.id}>
      <Link to={`/agente/tickets/${item.id}`} className="underline">{item.publicId}</Link> · {item.currentStatus} · Principal: {item.mainTicketId || "Es principal"}
    </li>)}</ul>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
