const INELIGIBLE_MAIN_STATUSES = new Set(["CANCELLED", "CLOSED", "DUPLICATE"]);

export function isEligibleDuplicateCandidate(ticket, candidate) {
  if (!candidate || candidate.id === ticket.id) return false;
  return !INELIGIBLE_MAIN_STATUSES.has(candidate.currentStatus);
}

function matchReasons(ticket, candidate) {
  const reasons = [];
  if (ticket.requestTypeCode && candidate.requestTypeCode === ticket.requestTypeCode) {
    reasons.push("Mismo tipo de solicitud");
  }
  if (ticket.neighborhoodName && candidate.neighborhoodName === ticket.neighborhoodName) {
    reasons.push("Mismo barrio");
  }
  return reasons;
}

export function rankDuplicateCandidates(ticket, candidates) {
  return candidates
    .filter((candidate) => isEligibleDuplicateCandidate(ticket, candidate))
    .map((candidate) => ({ ticket: candidate, matchReasons: matchReasons(ticket, candidate) }))
    .sort((a, b) => {
      if (a.matchReasons.length !== b.matchReasons.length) return b.matchReasons.length - a.matchReasons.length;
      return new Date(a.ticket.createdAt) - new Date(b.ticket.createdAt);
    });
}

// Campos anticipados para cuando el back exponga la vinculación en TicketResponse
// (todavía no implementado — ver Ticket.mainTicket en el back y memoria agent-resolve-flow).
// Se sigue la convención existente de pares Id/nombre (ej. assignedAgentId, requestTypeId+requestTypeName).
export function getDuplicateLinkInfo(ticket) {
  if (!ticket) return { isDuplicate: false, mainTicketId: null, mainTicketPublicId: null, duplicateTicketsCount: 0 };
  const mainTicketId = ticket.mainTicketId ?? ticket.mainTicket?.id ?? null;
  const mainTicketPublicId = ticket.mainTicketPublicId ?? ticket.mainTicket?.publicId ?? null;
  return {
    isDuplicate: Boolean(mainTicketId),
    mainTicketId,
    mainTicketPublicId,
    duplicateTicketsCount: ticket.duplicateTicketsCount ?? 0,
  };
}
