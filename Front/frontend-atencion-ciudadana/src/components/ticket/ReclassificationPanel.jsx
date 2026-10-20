import { useRef, useState } from "react";
import { abandonReclassificationProposal, confirmReclassificationProposal, downloadTicketAttachment, fetchReclassificationProposal, proposeTicketReclassification } from "../../services/apiClient";
import { canProposeReclassification, isOpenProposal, reclassificationErrorMessage } from "../../utils/reclassification";
import ReclassificationRequirements from "./ReclassificationRequirements";
import AttachmentGallery from "../ui/AttachmentGallery";

const STATUS_LABELS = { PROPOSED: "Propuesta", READY: "Lista para confirmar", WAITING_INFORMATION: "Esperando información", CONFIRMED: "Confirmada", ABANDONED: "Abandonada" };

export default function ReclassificationPanel({ ticket, requestTypes, readOnly, proposals, loading, error: loadError, onRefresh, onBusyChange }) {
  const [targetId, setTargetId] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const selectedProposal = selected?.ticket === ticket ? selected.proposal : null;
  const inFlight = useRef(false);
  const open = proposals.find(isOpenProposal);
  const run = async (operation, mutation = true) => {
    if (inFlight.current || (mutation && readOnly)) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    try {
      const result = await operation();
      if (mutation) {
        setSelected(null);
        setTargetId(""); setMessage(""); setReason("");
        await onRefresh();
      } else setSelected({ ticket, proposal: result });
    } catch (err) {
      setError(reclassificationErrorMessage(err));
      if ([409, 410].includes(err.status)) { setSelected(null); await onRefresh(); }
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };
  const unavailable = readOnly || busy || loading || Boolean(loadError);
  return (
    <section aria-label="Reclasificación" className="mt-4 border-t border-slate-200 pt-3 text-xs">
      <h3 className="font-semibold text-slate-900">Reclasificación provisional</h3>
      <p className="my-2 text-slate-500">La clasificación actual se conserva hasta confirmar. La confirmación inicia la gestión en el área destino.</p>
      <button type="button" disabled={busy || loading} onClick={onRefresh} className="my-1 underline disabled:opacity-50">Actualizar propuestas y ticket</button>
      {loading && <p>Cargando propuestas…</p>}
      {loadError && <div role="alert">No pudimos consultar las propuestas. <button type="button" onClick={onRefresh}>Reintentar</button></div>}
      {!open && canProposeReclassification(ticket) && !readOnly && (
        <form onSubmit={(event) => { event.preventDefault(); if (targetId) run(() => proposeTicketReclassification(ticket.id, { requestTypeId: Number(targetId), ...(message.trim() ? { messageForCitizen: message.trim() } : {}) })); }} className="space-y-2">
          <label className="block">Nuevo tipo propuesto
            <select aria-label="Nuevo tipo propuesto" value={targetId} required disabled={unavailable} onChange={(event) => setTargetId(event.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2">
              <option value="">Seleccionar…</option>
              {requestTypes.filter((type) => type.code !== ticket.requestTypeCode).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label className="block">Mensaje para el ciudadano (opcional)
            <textarea value={message} maxLength={4000} disabled={unavailable} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2" />
          </label>
          <button type="submit" disabled={unavailable || !targetId} className="rounded bg-[#0F2C59] px-3 py-2 text-white disabled:opacity-50">Proponer reclasificación</button>
        </form>
      )}
      {open && <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3">
        <p className="font-semibold">Propuesta #{open.id}: {requestTypes.find((type) => type.id === open.requestTypeId)?.name || `Tipo #${open.requestTypeId}`}</p>
        <p>{STATUS_LABELS[open.status]} · {open.origin === "REQUEST_TYPE_MISMATCH" ? "Excepción por devolución" : "Revisión inicial"}</p>
        {open.proposedData?.location && <p className="mt-2">Ubicación provisional: {open.proposedData.location.addressLine || open.proposedData.location.street || "Sin dirección"}
          {open.proposedData.location.latitude != null && ` · ${open.proposedData.location.latitude}, ${open.proposedData.location.longitude}`}
          {open.proposedData.location.neighborhoodId && ` · Barrio ${open.proposedData.location.neighborhoodId}`}
        </p>}
        {open.proposedData?.evidenceIds?.length > 0 && <AttachmentGallery title="Evidencia provisional"
          items={open.proposedData.evidenceIds.map((id, index) => ({ id, fileName: `Evidencia provisional ${index + 1}` }))}
          downloadFile={(attachment) => downloadTicketAttachment(attachment.id)} />}
        <ReclassificationRequirements requirements={open.requirements} />
        {!readOnly && <div className="space-y-2">
          <button type="button" disabled={unavailable || open.status !== "READY" || ticket.currentStatus !== "IN_REVIEW" || open.requirements?.identificationRequired} onClick={() => run(() => confirmReclassificationProposal(ticket.id, open.id))} className="rounded bg-[#0F2C59] px-3 py-2 text-white disabled:opacity-50">Confirmar reclasificación</button>
          <label className="block">Motivo de abandono
            <textarea value={reason} maxLength={4000} disabled={unavailable} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2" />
          </label>
          <button type="button" disabled={unavailable || !reason.trim()} onClick={() => run(() => abandonReclassificationProposal(ticket.id, open.id, reason.trim()))} className="rounded border border-slate-400 px-3 py-2 disabled:opacity-50">Abandonar propuesta</button>
        </div>}
      </div>}
      {proposals.length > 0 && <details className="mt-3"><summary>Historial de propuestas ({proposals.length})</summary><ul className="space-y-2 py-2">{proposals.map((proposal) => <li key={proposal.id}>
        <button type="button" disabled={busy} onClick={() => run(() => fetchReclassificationProposal(ticket.id, proposal.id), false)} className="underline">#{proposal.id} · {STATUS_LABELS[proposal.status]}</button>
        {proposal.abandonmentReason && <p>Motivo: {proposal.abandonmentReason}</p>}
      </li>)}</ul></details>}
      {selectedProposal && <div className="mt-2 rounded border p-2"><p>Detalle #{selectedProposal.id} · Tipo #{selectedProposal.requestTypeId} · Plantilla {selectedProposal.formTemplateId ?? "sin campos"} · {STATUS_LABELS[selectedProposal.status]}</p><ReclassificationRequirements requirements={selectedProposal.requirements} /></div>}
      {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    </section>
  );
}
