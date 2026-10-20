export default function ReclassificationRequirements({ requirements }) {
  if (!requirements) return null;
  const { fields = [], missingFields = [], availableAnswers = {} } = requirements;
  return (
    <div className="my-3 space-y-1 text-xs text-slate-700">
      <p className="font-semibold">Requisitos de la propuesta</p>
      {missingFields.length > 0 && <p>Pendientes: {missingFields.map((code) => fields.find((field) => field.code === code)?.label || code).join(", ")}</p>}
      {requirements.locationRequired && <p>Falta ubicación.</p>}
      {requirements.neighborhoodRequired && <p>Falta barrio.</p>}
      {requirements.evidenceRequired && <p>Falta evidencia adjunta.</p>}
      {requirements.identificationRequired && <p>El tipo exige identificación válida de M1. No puede confirmarse con acceso anónimo.</p>}
      {Object.keys(availableAnswers).length > 0 && (
        <dl aria-label="Respuestas disponibles">
          {Object.entries(availableAnswers).map(([code, value]) => <div key={code}><dt className="inline font-medium">{fields.find((field) => field.code === code)?.label || code}: </dt><dd className="inline">{value === null ? "No sé / No responde" : typeof value === "boolean" ? (value ? "Sí" : "No") : String(value)}</dd></div>)}
        </dl>
      )}
    </div>
  );
}
