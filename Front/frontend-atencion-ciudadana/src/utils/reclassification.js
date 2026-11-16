// The activity projection can suggest the exception; the endpoint also verifies
// the accepted Inbox event and its producer, which are not exposed to the UI.
export function canProposeReclassification(ticket) {
  if (ticket.currentStatus !== "IN_REVIEW" || ticket.pendingInformationRequest) return false;
  if (!ticket.classificationFinalizedAt) return true;
  for (const activity of [...(ticket.ticketActivities ?? [])].reverse()) {
    if (activity.actionType === "RETURNED_BY_AREA") {
      return activity.reasonCode === "REQUEST_TYPE_MISMATCH" && activity.newStatus === "IN_REVIEW";
    }
    if (["REQUEST_TYPE_CHANGED", "ROUTED", "REOPENED", "DUPLICATE_LINKED"].includes(activity.actionType) || activity.newStatus === "IN_PROGRESS") return false;
  }
  return false;
}

export const isOpenProposal = (proposal) => ["PROPOSED", "READY", "WAITING_INFORMATION"].includes(proposal.status);

export function reclassificationErrorMessage(error) {
  if (error.status === 410) return "El plazo para responder venció. Se actualizó el estado del trámite.";
  if (error.status === 409) return `Conflicto: ${error.message || "El estado del trámite cambió."}`;
  if (error.status === 422 || error.code === "EVIDENCE_REQUIRED") return "Falta adjuntar evidencia para el riesgo de esta clasificación.";
  return error.message || "No pudimos completar la operación. Intentá de nuevo.";
}
