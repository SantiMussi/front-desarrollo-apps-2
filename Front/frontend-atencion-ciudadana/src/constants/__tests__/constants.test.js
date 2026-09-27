import { describe, expect, it } from "vitest";
import { CANCELLATION_REASONS } from "../cancellationReasons";
import { RESPONSIBLE_AREAS, REQUEST_TYPE_AREA, getResponsibleAreaId } from "../responsibleAreas";
import { RESOLUTION_TYPES, RESOLUTION_TYPE_LABELS, SIMULATED_AREA_RESPONSES } from "../resolutionTypes";
import { SLA_STATUSES, SLA_STATUS_LABELS } from "../slaStatuses";
import { ACTIVITY_TYPE_LABELS } from "../ticketActivities";
import { CONFIRM_TARGET_STATUS, REOPEN_TARGET_STATUS, STATUS_TONES, TERMINAL_STATUSES, TICKET_STATUS_LABELS, statusTone } from "../ticketStatuses";

describe("catálogos constantes", () => {
  it("mantiene razones de cancelación únicas", () => {
    expect(CANCELLATION_REASONS).toHaveLength(8);
    expect(new Set(CANCELLATION_REASONS.map(({ value }) => value)).size).toBe(8);
  });

  it("mapea tipos de resolución y respuestas simuladas", () => {
    expect(RESOLUTION_TYPES).toHaveLength(5);
    for (const type of RESOLUTION_TYPES) expect(RESOLUTION_TYPE_LABELS[type.value]).toBe(type.label);
    for (const response of SIMULATED_AREA_RESPONSES) {
      expect(RESOLUTION_TYPE_LABELS[response.type]).toBeTruthy();
      expect(response.publicMessage).toBeTruthy();
      expect(response.internalMessage).toBeTruthy();
    }
  });

  it("resuelve el área responsable o el área predeterminada", () => {
    expect(getResponsibleAreaId("101")).toBe(REQUEST_TYPE_AREA[101]);
    expect(getResponsibleAreaId("desconocido")).toBe("M2");
    expect(RESPONSIBLE_AREAS.M2).toBe("Atención Ciudadana");
  });

  it("relaciona estados SLA con etiquetas", () => {
    expect(Object.keys(SLA_STATUSES)).toHaveLength(4);
    for (const status of Object.values(SLA_STATUSES)) expect(SLA_STATUS_LABELS[status]).toBeTruthy();
    expect(Object.isFrozen(SLA_STATUSES)).toBe(true);
  });

  it("mantiene etiquetas de actividades y tickets", () => {
    expect(ACTIVITY_TYPE_LABELS.TICKET_CREATED).toBe("Ticket creado");
    expect(TICKET_STATUS_LABELS.IN_PROGRESS).toBe("En gestión");
    expect(statusTone("IN_PROGRESS")).toBe(STATUS_TONES.amber);
    expect(statusTone("UNKNOWN")).toBe(STATUS_TONES.gray);
    expect(TERMINAL_STATUSES.has("CLOSED")).toBe(true);
    expect(CONFIRM_TARGET_STATUS).toBe("CLOSED");
    expect(REOPEN_TARGET_STATUS).toBe("IN_PROGRESS");
  });
});