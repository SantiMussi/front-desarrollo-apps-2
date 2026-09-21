// El back ya expone la vinculación real vía ticket.mainTicketId (ver
// GET /staff/tickets/{id}/duplicate-candidates y POST .../duplicate). No
// expone todavía la lista inversa (duplicados de este ticket), por eso
// duplicateTicketsCount siempre da 0 hasta que el back agregue ese campo.
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
