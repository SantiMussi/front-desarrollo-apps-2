export const SLA_STATUSES = Object.freeze({
  ON_TRACK: "ON_TRACK",
  NEAR_DUE: "NEAR_DUE",
  BREACHED: "BREACHED",
  NO_SLA: "NO_SLA",
});

export const SLA_STATUS_LABELS = Object.freeze({
  [SLA_STATUSES.ON_TRACK]: "En plazo",
  [SLA_STATUSES.NEAR_DUE]: "Próximo a vencer",
  [SLA_STATUSES.BREACHED]: "SLA vencido",
  [SLA_STATUSES.NO_SLA]: "Sin SLA",
});