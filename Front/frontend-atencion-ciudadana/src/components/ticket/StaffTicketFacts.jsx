import { hasTicketLocation } from "../../utils/ticketLocation";

function answer(value, field) {
  if (value === null) return "No sé / No responde";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (field?.type === "SELECT") {
    const option = field.options?.find((item) => (item?.value ?? item) === value);
    return option?.label ?? String(value);
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export default function StaffTicketFacts({ ticket }) {
  const values = ticket.formData ?? {};
  const fields = ticket.formTemplate?.fields ?? [];
  const codes = new Set(fields.map((field) => field.code));
  const rows = [...fields, ...Object.keys(values).filter((code) => !codes.has(code)).map((code) => ({ code, label: code }))];
  const location = ticket.location;
  return <section className="space-y-5 border-b border-slate-200 py-6 text-sm">
    <div>
      <h2 className="mb-3 font-semibold">Respuestas del formulario</h2>
      {ticket.formTemplate && <p className="mb-2 text-xs text-slate-500">Formulario #{ticket.formTemplate.id} · Versión {ticket.formTemplate.version}</p>}
      {rows.length ? <dl className="space-y-3">{rows.map((field) => <div key={field.code}>
        <dt className="font-medium">{field.label} <span className="text-xs text-slate-400">({field.code})</span></dt>
        <dd className="whitespace-pre-wrap text-slate-600">{Object.hasOwn(values, field.code) ? answer(values[field.code], field) : "Sin respuesta"}</dd>
      </div>)}</dl> : <p className="text-slate-500">Sin respuestas registradas.</p>}
    </div>
    <div>
      <h2 className="mb-3 font-semibold">Ubicación informada</h2>
      {hasTicketLocation(ticket) ? <dl className="space-y-1 text-slate-600">
        {location?.addressLine && <div><dt className="inline font-medium">Dirección: </dt><dd className="inline">{location.addressLine}</dd></div>}
        {(location?.street || location?.streetNumber) && <div><dt className="inline font-medium">Calle: </dt><dd className="inline">{location.street} {location.streetNumber}</dd></div>}
        {(location?.neighborhoodName || location?.neighborhoodId || ticket.neighborhoodName) && <div><dt className="inline font-medium">Barrio: </dt><dd className="inline">{location?.neighborhoodName || ticket.neighborhoodName || location.neighborhoodId}</dd></div>}
        {location?.latitude != null && location?.longitude != null && <div><dt className="inline font-medium">Coordenadas: </dt><dd className="inline">{location.latitude}, {location.longitude}</dd></div>}
      </dl> : <p className="text-slate-500">Sin ubicación informada.</p>}
      {location?.reference && <p className="mt-1 text-slate-600">Referencia: {location.reference}</p>}
    </div>
    <div><h2 className="mb-2 font-semibold">Progreso operativo</h2><p className="text-slate-600">{ticket.currentProgress == null ? "Sin progreso informado." : `${ticket.currentProgress}%`}</p></div>
  </section>;
}
