import { CANCELLATION_STATUS_LABELS } from "../../utils/cancellation";

export default function CancellationHistory({ items, staff = false }) {
  return <ul className="space-y-3">{items.map((item) => <li key={item.id} className="rounded-lg border border-slate-200 p-3">
    <p className="font-semibold">{CANCELLATION_STATUS_LABELS[item.status]} <span className="font-normal">({item.status})</span></p>
    <p>Motivo: {item.reasonCode} · {item.reason}</p>
    <p>Solicitada: {new Date(item.requestedAt).toLocaleString("es-AR")}</p>
    {staff && <p>Solicitante: {item.requesterKind === "ANONYMOUS" ? "Anónimo acreditado" : `Identificado · ${item.requestedByCitizenId}`}</p>}
    {item.reviewedAt && <p>Decisión: {new Date(item.reviewedAt).toLocaleString("es-AR")}</p>}
    {item.cancellationScope && <p>Alcance aplicado: {item.cancellationScope}</p>}
    {staff && item.decisionReason && <p>Justificación interna: {item.decisionReason}</p>}
    {staff && item.reviewedBy && <p>Revisada por: {item.reviewedBy}</p>}
  </li>)}</ul>;
}
