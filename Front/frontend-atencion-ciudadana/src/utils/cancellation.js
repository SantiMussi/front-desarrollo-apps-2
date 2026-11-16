export const CANCELLATION_STATUS_LABELS = { PENDING: "Pendiente de revisión", APPROVED: "Aprobada", REJECTED: "Rechazada" };

// The legacy API has no separate error code for this case. Match its specific
// cause as well as HTTP/code and the refreshed effective status, never any 409.
export function cancellationReviewRequired(error, ticket) {
  return error?.status === 409 && error.code === "TICKET_STATE_CONFLICT"
    && ticket?.currentStatus === "REGISTERED"
    && error.message === "El principal tiene duplicados activos: requiere una solicitud de cancelación y revisión administrativa";
}

export function cancellationErrorMessage(error) {
  switch (error?.status) {
    case 400: return "Revisá los datos y los motivos obligatorios (máximo 4000 caracteres).";
    case 401: return "La autenticación o acreditación no es válida. Volvé a ingresar.";
    case 403: return "No tenés permiso para esta operación. La decisión también puede afectar un ticket propio de la familia.";
    case 404: return "No encontramos el ticket o la revisión asociada.";
    case 409: return "La operación no se aplicó: cambió el estado, existe una solicitud o hay otra gestión concurrente. Revisá los datos actualizados. Una solicitud desactualizada debe rechazarse con justificación.";
    case 410: return "El pedido de información venció. Consultá el estado actual y la revisión administrativa.";
    default: return "No pudimos verificar o completar la operación. Actualizá los datos antes de continuar.";
  }
}
