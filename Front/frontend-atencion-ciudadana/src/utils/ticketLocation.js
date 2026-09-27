export const NO_LOCATION_FILTER = "__NO_LOCATION__";

export function hasTicketLocation(ticket) {
  return Boolean(
    ticket?.neighborhoodId ||
      ticket?.neighborhoodName ||
      ticket?.location?.neighborhoodId ||
      ticket?.location?.neighborhoodName ||
      ticket?.location?.addressLine
  );
}