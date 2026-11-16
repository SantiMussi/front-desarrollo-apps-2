import { ATTACHMENT_ACCEPT, attachmentError } from "../../utils/attachments";
import { useEffect, useId, useRef, useState } from "react";
import { fetchNeighborhoods } from "../../services/apiClient";
import ReclassificationRequirements from "./ReclassificationRequirements";

const inputClass = "mt-1 w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm";

export default function ReclassificationResponseForm({ requirements, dueAt, loading, error, onAnswer }) {
  const prefix = useId();
  const [answers, setAnswers] = useState(() => ({ ...requirements.availableAnswers }));
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState({});
  const [files, setFiles] = useState([]);
  const [localError, setLocalError] = useState(null);
  const [sending, setSending] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [neighborhoodError, setNeighborhoodError] = useState(null);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const inFlight = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const expired = Boolean(dueAt && new Date(dueAt).getTime() <= now);
  const disabled = loading || sending || expired;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (requirements.neighborhoodRequired) fetchNeighborhoods().then(
      (items) => { if (!cancelled) { setNeighborhoods(items); setNeighborhoodError(null); } },
      () => { if (!cancelled) setNeighborhoodError("No pudimos cargar los barrios."); },
    );
    return () => { cancelled = true; };
  }, [requirements.neighborhoodRequired, catalogRetry]);

  const setAnswer = (field, raw) => {
    setAnswers((previous) => {
      const next = { ...previous };
      if (raw === "" && ["BOOLEAN", "NUMBER", "DATE", "SELECT"].includes(field.type)) delete next[field.code];
      else next[field.code] = field.type === "BOOLEAN" ? raw === "true" : raw;
      return next;
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (disabled || inFlight.current) return;
    const data = {};
    for (const field of requirements.fields) {
      if (!Object.hasOwn(answers, field.code)) {
        if (field.required) { setLocalError(`Falta completar: ${field.label}.`); return; }
        continue;
      }
      const value = answers[field.code];
      if (value === null && !field.allowUnknown) { setLocalError(`${field.label} no admite un valor desconocido.`); return; }
      const parsed = field.type === "NUMBER" && value !== null ? Number(value) : value;
      if (field.type === "NUMBER" && value !== null && (!Number.isFinite(parsed) || (field.config?.min != null && parsed < field.config.min) || (field.config?.max != null && parsed > field.config.max))) {
        setLocalError(`Revisá el rango de ${field.label}.`); return;
      }
      data[field.code] = parsed;
    }
    const filesError = attachmentError(files);
    if (filesError) { setLocalError(filesError); return; }
    if (requirements.evidenceRequired && files.length === 0) { setLocalError("Falta adjuntar evidencia."); return; }
    const suppliedLocation = Object.fromEntries(Object.entries(location).filter(([, value]) => value !== ""));
    if (requirements.locationRequired && !suppliedLocation.addressLine?.trim() && !suppliedLocation.neighborhoodId && !(suppliedLocation.latitude != null && suppliedLocation.longitude != null)) {
      setLocalError("Falta completar la ubicación."); return;
    }
    if (requirements.neighborhoodRequired && !suppliedLocation.neighborhoodId) { setLocalError("Falta seleccionar el barrio."); return; }
    if ((suppliedLocation.latitude != null) !== (suppliedLocation.longitude != null)) { setLocalError("Informá latitud y longitud juntas."); return; }
    for (const [key, limit] of [["latitude", 90], ["longitude", 180]]) {
      if (suppliedLocation[key] != null) {
        suppliedLocation[key] = Number(suppliedLocation[key]);
        if (!Number.isFinite(suppliedLocation[key]) || Math.abs(suppliedLocation[key]) > limit) { setLocalError("Las coordenadas son inválidas."); return; }
      }
    }
    inFlight.current = true;
    setSending(true);
    setLocalError(null);
    try {
      const ok = await onAnswer(message.trim() || null, files, { formData: data, ...(Object.keys(suppliedLocation).length ? { location: suppliedLocation } : {}) });
      if (ok) { setMessage(""); setFiles([]); }
    } finally { inFlight.current = false; setSending(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Respuesta de reclasificación">
      <p className="text-sm font-semibold">Información para revisar la clasificación</p>
      <p className="text-xs">Tu respuesta vuelve a revisión. El municipio debe confirmar la reclasificación.</p>
      <ReclassificationRequirements requirements={requirements} />
      <fieldset disabled={disabled} className="space-y-3">
        {[...requirements.fields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map((field) => {
          const id = `${prefix}-${field.code}`;
          const unknown = answers[field.code] === null;
          const value = answers[field.code] ?? "";
          const controlProps = { id, value: String(value), disabled: unknown, className: inputClass, onChange: (event) => setAnswer(field, event.target.value) };
          return <div key={field.code}>
            <label htmlFor={id} className="text-sm font-medium">{field.label}{field.required ? " (obligatorio)" : " (opcional)"}</label>
            {field.type === "BOOLEAN" || field.type === "SELECT" ? <select {...controlProps}>
              <option value="">Seleccionar…</option>
              {(field.type === "BOOLEAN" ? [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] : field.config?.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label || option.value}</option>)}
            </select> : field.type === "TEXTAREA" ? <textarea {...controlProps} rows={3} /> : <input {...controlProps} type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"} step={field.type === "NUMBER" ? "any" : undefined} min={field.config?.min} max={field.config?.max} />}
            {field.allowUnknown && <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={unknown} onChange={(event) => setAnswers((previous) => { const next = { ...previous }; if (event.target.checked) next[field.code] = null; else delete next[field.code]; return next; })} />No sé / No responde: {field.label}</label>}
          </div>;
        })}
        {requirements.locationRequired && <div className="space-y-2">
          <label className="block text-sm">Dirección<input className={inputClass} value={location.addressLine ?? ""} maxLength={300} onChange={(event) => setLocation((previous) => ({ ...previous, addressLine: event.target.value }))} /></label>
          <p className="text-xs">Podés indicar una dirección o las coordenadas.</p>
          {["latitude", "longitude"].map((key) => <label key={key} className="block text-sm">{key === "latitude" ? "Latitud" : "Longitud"}<input className={inputClass} type="number" step="any" value={location[key] ?? ""} onChange={(event) => setLocation((previous) => ({ ...previous, [key]: event.target.value }))} /></label>)}
        </div>}
        {requirements.neighborhoodRequired && <label className="block text-sm">Barrio<select className={inputClass} value={location.neighborhoodId ?? ""} onChange={(event) => setLocation((previous) => ({ ...previous, neighborhoodId: event.target.value }))}><option value="">Seleccionar…</option>{neighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {neighborhoodError && <p role="alert">{neighborhoodError} <button type="button" onClick={() => setCatalogRetry((current) => current + 1)}>Reintentar barrios</button></p>}
        <label className="block text-sm">Tu respuesta (opcional)<textarea className={inputClass} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
        <label className="block text-sm">{requirements.evidenceRequired ? "Adjuntar evidencia (obligatoria)" : "Adjuntar evidencia (opcional)"}<input type="file" multiple accept={ATTACHMENT_ACCEPT} onChange={(event) => { const selected = Array.from(event.target.files); event.target.value = ""; const validation = attachmentError([...files, ...selected]); setLocalError(validation); if (!validation) setFiles((previous) => [...previous, ...selected]); }} className="mt-1 block w-full text-xs" /></label>
        <ul>{files.map((file, index) => <li key={`${file.name}-${index}`} className="text-xs">{file.name} <button type="button" aria-label={`Quitar ${file.name}`} onClick={() => setFiles((previous) => previous.filter((_, position) => position !== index))}>Quitar</button></li>)}</ul>
        <button type="submit" className="rounded bg-[#0F2C59] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending || loading ? "Enviando…" : "Enviar respuesta"}</button>
      </fieldset>
      {expired && <p role="alert">El plazo para responder venció.</p>}
      {(localError || error) && <p role="alert" className="text-sm text-red-700">{localError || error}</p>}
    </form>
  );
}
