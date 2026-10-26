import { UNKNOWN_VALUE } from "./ticketFormValidation";

const UNANSWERED = "Sin responder";

const absent = (value) => value === undefined || value === null || value === "";

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function formatAnswer(field, raw) {
  if (raw === UNKNOWN_VALUE) return "No sé / Prefiero no responder";
  if (absent(raw)) return UNANSWERED;
  if (field.backendType === "BOOLEAN") return raw === true || raw === "true" ? "Sí" : "No";
  if (field.backendType === "SELECT") {
    const option = (field.options ?? []).find((candidate) => candidate.value === raw);
    return option?.label ?? String(raw);
  }
  if (field.backendType === "DATE") return formatDate(String(raw));
  return String(raw);
}

function locationLines({ formData, neighborhoods }) {
  const lines = [];
  const street = [formData.address.trim(), formData.streetNumber.trim()].filter(Boolean).join(" ");
  if (street) lines.push(street);
  const neighborhood = neighborhoods.find((candidate) => candidate.id === formData.neighborhoodId);
  if (neighborhood) lines.push(`Barrio ${neighborhood.name}`);
  if (!absent(formData.latitude) && !absent(formData.longitude)) lines.push("Punto marcado en el mapa");
  return lines;
}

/**
 * Convierte lo cargado en el formulario en filas legibles para la pantalla de revisión.
 * `target` es el selector del campo al que vuelve «Corregir»; nunca incluye contraseñas.
 */
export function buildReviewItems({ requestType, formData, specificFields, neighborhoods = [], attachments = [], anonymous = false }) {
  const items = [
    { id: "type", label: "Tipo de solicitud", lines: [requestType.name] },
    { id: "summary", label: "Título", lines: [formData.summary.trim()], target: '[name="summary"]' },
    { id: "description", label: "Descripción", lines: [formData.description.trim()], target: '[name="description"]' },
  ];

  const location = locationLines({ formData, neighborhoods });
  items.push({ id: "location", label: "Ubicación", lines: location.length ? location : ["Sin ubicación indicada"], target: '[name="address"]' });

  specificFields.forEach((field) => {
    items.push({
      id: `specific_${field.key}`,
      label: field.label,
      lines: [formatAnswer(field, formData.specificData[field.key])],
      target: `[name="specific_${field.key}"]`,
    });
  });

  items.push({
    id: "attachments",
    label: "Archivos adjuntos",
    lines: attachments.length ? attachments.map((file) => file.name) : ["Sin archivos adjuntos"],
    target: "#ticket-attachments",
  });

  if (anonymous) {
    items.push(
      { id: "anonymous", label: "Presentación", lines: ["Anónima"], target: "#ticket-anonymous" },
      { id: "contact", label: "Contacto", lines: [formData.contactChannel.trim() || "No dejaste un contacto"], target: '[name="contactChannel"]' },
      {
        id: "password",
        label: "Contraseña del reclamo",
        lines: [formData.ticketPassword.trim() ? "Elegida por vos (no se muestra)" : "Te la generamos al enviar"],
        target: "#ticketPassword",
      },
    );
  }
  return items;
}
