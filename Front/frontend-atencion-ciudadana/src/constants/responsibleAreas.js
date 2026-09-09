export const RESPONSIBLE_AREAS = {
  M1: "Ciudadanos",
  M2: "Atención Ciudadana",
  M3: "Obras Públicas",
  M4: "Habilitaciones",
  M5: "Rentas",
  M6: "Servicios Urbanos",
  M7: "Tránsito",
  M8: "Desarrollo Social",
};

export const REQUEST_TYPE_AREA = { // TEMP - en la bdd estan las areas como Mx, siendo x el número
  101: "M6",
  102: "M3",
  103: "M6",
  104: "M6",
  105: "M7",
};

export const getResponsibleAreaId = (requestTypeId) => REQUEST_TYPE_AREA[Number(requestTypeId)] || "M2";