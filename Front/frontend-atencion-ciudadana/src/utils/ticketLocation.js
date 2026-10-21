export const NO_LOCATION_FILTER = "__NO_LOCATION__";

export function hasTicketLocation(ticket) {
  if (typeof ticket?.hasLocation === "boolean") return ticket.hasLocation;
  return Boolean(
    ticket?.neighborhoodId ||
      ticket?.neighborhoodName ||
      ticket?.location?.neighborhoodId ||
      ticket?.location?.neighborhoodName ||
      ticket?.location?.addressLine?.trim() ||
      ticket?.location?.street?.trim() ||
      (ticket?.location?.latitude != null && ticket?.location?.longitude != null)
  );
}