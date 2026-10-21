const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const UNKNOWN_VALUE = "__UNKNOWN__";

const absent = (value) => value === undefined || value === null || value === "";

// Creation accepts addressLine OR a catalog neighborhood OR a complete coordinate pair.
// Street number alone and free-text references are not sufficient locations.
export function creationLocation(data, required) {
  const address = data.address.trim();
  const number = data.streetNumber.trim();
  const neighborhoodId = data.neighborhoodId || null;
  const hasLat = !absent(data.latitude);
  const hasLng = !absent(data.longitude);
  if (neighborhoodId && !UUID_RE.test(neighborhoodId)) return { error: "Seleccioná un barrio válido del catálogo." };
  if (hasLat !== hasLng) return { error: "Informá latitud y longitud juntas." };
  const latitude = hasLat ? Number(data.latitude) : null;
  const longitude = hasLng ? Number(data.longitude) : null;
  const numeric = (value) => typeof value === "number" || typeof value === "string" && value.trim() !== "";
  if (hasLat && (!numeric(data.latitude) || !numeric(data.longitude) || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
    return { error: "Las coordenadas son inválidas." };
  }
  if (!address && !neighborhoodId && !hasLat) {
    return required ? { error: "Indicá una dirección, un barrio o coordenadas válidas." } : { location: null };
  }
  return { location: { addressLine: address ? `${address} ${number}`.trim() : "", street: address, streetNumber: number, neighborhoodId, latitude, longitude, reference: "" } };
}

// Keep JSON false/0, omit unanswered controls, and send null only for explicit unknown.
export function specificAnswers(fields, answers) {
  const data = {};
  const errors = {};
  for (const field of fields) {
    const raw = answers[field.key];
    const errorKey = `specific_${field.key}`;
    if (raw === UNKNOWN_VALUE || raw === null) {
      if (field.allowUnknown) data[field.code] = null;
      else errors[errorKey] = `${field.label} no admite un valor desconocido`;
      continue;
    }
    if (raw === undefined || raw === "") {
      if (field.required) errors[errorKey] = field.allowUnknown
        ? `Respondé "${field.label}" o marcá "No sé / Prefiero no responder"`
        : `${field.label} es obligatorio`;
      continue;
    }
    let value = raw;
    if (field.backendType === "BOOLEAN") {
      if (![true, false, "true", "false"].includes(raw)) errors[errorKey] = `Revisá ${field.label}`;
      value = raw === true || raw === "true";
    } else if (field.backendType === "NUMBER") {
      value = Number(raw);
      if (String(raw).trim() === "" || !Number.isFinite(value) || (field.config?.min != null && value < field.config.min) || (field.config?.max != null && value > field.config.max)) errors[errorKey] = `Revisá el rango de ${field.label}`;
    } else if (field.backendType === "SELECT") {
      if (!field.options.some((option) => option.value === raw)) errors[errorKey] = `Seleccioná una opción válida para ${field.label}`;
    } else if (field.backendType === "DATE") {
      const date = new Date(`${raw}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) errors[errorKey] = `Revisá la fecha de ${field.label}`;
    }
    data[field.code] = value;
  }
  return { data, errors };
}
