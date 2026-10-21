export function indicatorOverview(overrides = {}) {
  return {
    generatedAt: "2026-10-21T12:00:00Z", periodStart: "2026-09-21T12:00:00Z", previousPeriodStart: "2026-08-22T12:00:00Z",
    counts: { total: 125, active: 120, unassigned: 3, overdue: 2, nearDue: 1, urgent: 4, resolved: 5, escalated: 2, reopenCount: 3, completedSlaMeasured: 4, completedSlaMet: 3, averageResolutionHours: 4, previousTotal: 100 },
    statuses: [{ key: "IN_PROGRESS", name: "IN_PROGRESS", count: 120 }, { key: "CLOSED", name: "CLOSED", count: 5 }],
    categories: [{ key: "1", name: "Alumbrado", count: 125 }],
    neighborhoods: [{ key: "n1", name: "Palermo", count: 124 }, { key: "", name: "Sin barrio informado", count: 1 }],
    areas: [{ key: "AREA-LIGHTING", name: "AREA-LIGHTING", count: 125 }],
    trend: [{ from: "2026-10-20T00:00:00Z", created: 125, resolved: 5 }],
    attention: [{ id: "old-125", publicId: "TK-125", summary: "Urgente fuera de la primera página", currentStatus: "IN_PROGRESS", currentPriority: "CRITICAL", escalated: true, slaBreached: true, resolutionDueAt: "2026-10-20T12:00:00Z" }],
    ...overrides,
  };
}
export const emptyOverview = () => indicatorOverview({
  counts: { total: 0, active: 0, unassigned: 0, overdue: 0, nearDue: 0, urgent: 0, resolved: 0, escalated: 0, reopenCount: 0, completedSlaMeasured: 0, completedSlaMet: 0, averageResolutionHours: null, previousTotal: 0 },
  statuses: [], categories: [], neighborhoods: [], areas: [], trend: [], attention: [],
});
