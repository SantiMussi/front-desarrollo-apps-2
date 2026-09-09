const TERMINAL_STATUSES = new Set(["RESOLVED", "CLOSED", "DUPLICATE", "CANCELLED"]);

export const SLA_ALERT_THRESHOLD = 80;

export function getSlaIndicator(ticket) {
  if (!ticket || TERMINAL_STATUSES.has(ticket.currentStatus)) {
    return { status: "not-applicable", percentage: null, label: "No aplica" };
  }

  const percentage = Number(
    ticket.slaPercentage ?? ticket.sla?.percentage ?? ticket.sla?.consumedPercentage
  );

  if (!Number.isFinite(percentage)) {
    return { status: "on-track", percentage: null, label: "En plazo" };
  }

  if (percentage >= 100) {
    return { status: "overdue", percentage, label: "SLA vencido" };
  }

  if (percentage >= SLA_ALERT_THRESHOLD) {
    return { status: "at-risk", percentage, label: "Próximo a vencer" };
  }

  return { status: "on-track", percentage, label: "En plazo" };
}

export function isTicketEscalated(ticket) {
  return ticket?.isEscalated === true || ticket?.escalated === true;
}