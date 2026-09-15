const TERMINAL_STATUSES = new Set(["RESOLVED", "CLOSED", "DUPLICATE", "CANCELLED"]);

export const SLA_ALERT_THRESHOLD = 80;

export function getSlaIndicator(ticket) {
  if (!ticket) {
    return { status: "not-applicable", percentage: null, label: "No aplica" };
  }

  if (ticket.slaBreached === true) {
    return { status: "overdue", percentage: null, label: "SLA vencido" };
  }

  if (ticket.slaNearDue === true) {
    return { status: "at-risk", percentage: null, label: "Próximo a vencer" };
  }

  if (TERMINAL_STATUSES.has(ticket.currentStatus)) {
    return { status: "not-applicable", percentage: null, label: "No aplica" };
  }

  return { status: "on-track", percentage: null, label: "En plazo" };
}

export function isTicketEscalated(ticket) {
  return ticket?.escalated === true;
}