import { describe, expect, it } from "vitest";
import { messageForCatalogError } from "../catalogErrors";
import { getDuplicateLinkInfo } from "../duplicateLink";
import { getSlaIndicator, hasResolutionSlaInfo, isTicketEscalated, SLA_ALERT_THRESHOLD } from "../ticketIndicators";
import { hasTicketLocation, NO_LOCATION_FILTER } from "../ticketLocation";

describe("messageForCatalogError", () => {
  it.each([
    [{ status: 401 }, "Tu sesión no es válida. Volvé a iniciar sesión."],
    [{ status: 403 }, "No tenés permiso para administrar el catálogo."],
    [{ status: 404 }, "No encontramos ese registro. Puede haber sido eliminado."],
    [{ status: 409 }, "Ya existe un registro con esos datos."],
    [{ status: 409, code: "ACTIVE_CHILD", message: "Hay hijos activos" }, "Hay hijos activos"],
    [{ status: 409, code: "DEPENDENCY" }, "No se puede cambiar el estado porque hay registros relacionados activos."],
    [{ status: 409, message: "Registro asociado" }, "Registro asociado"],
    [{ status: 400 }, "Revisá los datos ingresados."],
    [{ status: 400, message: "Dato inválido" }, "Dato inválido"],
    [{ message: "Error remoto" }, "Error remoto"],
    [null, "No pudimos completar la operación. Intentá de nuevo."],
  ])("traduce %#", (error, expected) => expect(messageForCatalogError(error)).toBe(expected));
});

describe("getDuplicateLinkInfo", () => {
  it("devuelve el resultado vacío sin ticket", () => {
    expect(getDuplicateLinkInfo()).toEqual({ isDuplicate: false, mainTicketId: null, mainTicketPublicId: null, duplicateTicketsCount: 0 });
  });

  it("prioriza los campos directos y conserva la cantidad", () => {
    expect(getDuplicateLinkInfo({ mainTicketId: 1, mainTicketPublicId: "T-1", mainTicket: { id: 2, publicId: "T-2" }, duplicateTicketsCount: 3 })).toEqual({
      isDuplicate: true, mainTicketId: 1, mainTicketPublicId: "T-1", duplicateTicketsCount: 3,
    });
  });

  it("acepta la relación anidada y aplica valores predeterminados", () => {
    expect(getDuplicateLinkInfo({ mainTicket: { id: 2, publicId: "T-2" } })).toEqual({
      isDuplicate: true, mainTicketId: 2, mainTicketPublicId: "T-2", duplicateTicketsCount: 0,
    });
    expect(getDuplicateLinkInfo({})).toEqual({ isDuplicate: false, mainTicketId: null, mainTicketPublicId: null, duplicateTicketsCount: 0 });
  });
});

describe("indicadores de SLA", () => {
  it("clasifica vencidos, próximos a vencer y vigentes", () => {
    expect(getSlaIndicator({ slaBreached: true })).toMatchObject({ status: "overdue", label: "SLA vencido" });
    expect(getSlaIndicator({ slaNearDue: true })).toMatchObject({ status: "at-risk", label: "Próximo a vencer" });
    expect(getSlaIndicator({ slaBreached: false, slaNearDue: false })).toMatchObject({ status: "on-track", label: "En plazo" });
  });

//   it("no clasifica tickets sin SLA como En plazo ni los incluye entre los medidos", () => {
//     const ticketWithoutSla = { currentStatus: "IN_PROGRESS" };
//     expect(getSlaIndicator(ticketWithoutSla)).toEqual({ status: "not-applicable", percentage: null, label: "No aplica" });
//     expect(hasResolutionSlaInfo(ticketWithoutSla)).toBe(false);
//     expect(hasResolutionSlaInfo({ slaPercentage: 0 })).toBe(true);
//     expect(hasResolutionSlaInfo()).toBe(false);
//   });

  it.each([undefined, { currentStatus: "RESOLVED" }, { currentStatus: "CLOSED" }, { currentStatus: "DUPLICATE" }, { currentStatus: "CANCELLED" }])(
    "marca como no aplicable %#", (ticket) => expect(getSlaIndicator(ticket).status).toBe("not-applicable")
  );

  it("expone escalamiento y umbral", () => {
    expect(isTicketEscalated({ escalated: true })).toBe(true);
    expect(isTicketEscalated({ escalated: false })).toBe(false);
    expect(isTicketEscalated()).toBe(false);
    expect(SLA_ALERT_THRESHOLD).toBe(80);
  });
});

describe("ubicación", () => {
  it.each([
    [{ neighborhoodId: 1 }], [{ neighborhoodName: "Centro" }],
    [{ location: { neighborhoodId: 2 } }], [{ location: { neighborhoodName: "Norte" } }],
    [{ location: { addressLine: "Calle 1" } }],
  ])("detecta las variantes de ubicación", (ticket) => expect(hasTicketLocation(ticket)).toBe(true));

  it("detecta tickets sin ubicación", () => {
    expect(hasTicketLocation({ location: {} })).toBe(false);
    expect(hasTicketLocation()).toBe(false);
    expect(NO_LOCATION_FILTER).toBe("__NO_LOCATION__");
  });
});