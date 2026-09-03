import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, RotateCcw, ArrowLeft, Copy, CheckCircle, Paperclip, X, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import FormField from "./FormField";
import LocationMap from "./LocationMap";
import Spinner from "./Spinner";
import Alert from "./Alert";
import { useCreateTicket } from "../../hooks/useCreateTicket";
import { NEIGHBORHOODS } from "../../data/mockCategories";
import { fetchRequestTypeForm } from "../../services/apiClient";

function validateForm(formData, specificFields) {
  const errors = {};

  if (!formData.summary.trim()) {
    errors.summary = "El título / resumen es obligatorio";
  }

  if (!formData.description.trim()) {
    errors.description = "La descripción es obligatoria";
  } else if (formData.description.trim().length < 10) {
    errors.description = "La descripción debe tener al menos 10 caracteres";
  }

  if (!formData.address.trim()) {
    errors.address = "La dirección es obligatoria";
  }

  if (!formData.neighborhoodId) {
    errors.neighborhoodId = "Seleccioná un barrio";
  }

  if (Array.isArray(specificFields)) {
    specificFields.forEach((field) => {
      if (field.required && !formData.specificData[field.key]) {
        errors[`specific_${field.key}`] = `${field.label} es obligatorio`;
      }
    });
  }

  return errors;
}

export default function TicketForm({ requestType, onBack, onNewTicket, onDirtyChange, onStatusChange }) {
  const navigate = useNavigate();
  const { submit, loading, error, trackingCode, reset } = useCreateTicket();
  const [copied, setCopied] = useState(false);

  const [specificFields, setSpecificFields] = useState(requestType.specificFields || []);
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadFields() {
      setLoadingFields(true);
      try {
        const res = await fetchRequestTypeForm(requestType.code || requestType.id);
        let arr = [];
        if (Array.isArray(res)) {
          arr = res;
        } else if (res && Array.isArray(res.fields)) {
          arr = res.fields;
        } else if (res && Array.isArray(res.data)) {
          arr = res.data;
        }
        if (!cancelled) setSpecificFields(arr);
      } catch (err) {
        console.error("Error loading specific fields:", err);
      } finally {
        if (!cancelled) setLoadingFields(false);
      }
    }
    if (requestType.specificFields && requestType.specificFields.length > 0) {
      setSpecificFields(requestType.specificFields);
    } else {
      loadFields();
    }
    return () => { cancelled = true; };
  }, [requestType]);

  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    address: "",
    addressSource: null, // "input" when typed, "map" when set from map
    neighborhoodId: "",
    latitude: null,
    longitude: null,
    isAnonymous: false,
    specificData: {},
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [attachments, setAttachments] = useState([]);

  // Notificar al padre cuando el formulario tiene datos
  useEffect(() => {
    if (!onDirtyChange) return;
    const isDirty =
      formData.summary.trim() !== "" ||
      formData.description.trim() !== "" ||
      formData.address.trim() !== "" ||
      formData.neighborhoodId !== "" ||
      Object.values(formData.specificData).some((v) => v && String(v).trim() !== "") ||
      attachments.length > 0;
    onDirtyChange(isDirty);
  }, [formData, attachments, onDirtyChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // When the user manually edits the address, mark source as "input"
      // and clear coordinates so the map will forward-geocode via debounce
      ...(name === "address" ? { addressSource: "input", latitude: null, longitude: null } : {}),
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSpecificChange = (e) => {
    const { name, value } = e.target;
    const fieldKey = name.replace("specific_", "");
    setFormData((prev) => ({
      ...prev,
      specificData: { ...prev.specificData, [fieldKey]: value },
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Called when the user clicks/drags on the map (source="map")
  // or when forward geocode completes from typing (source="geocode")
  const handleLocationSelect = useCallback(({ lat, lng, address: addr, neighborhoods, source }) => {
    let matchedNeighborhoodId = undefined;
    if (neighborhoods && neighborhoods.length > 0) {
      for (const nb of neighborhoods) {
        if (!nb) continue;
        const normalizedQuery = nb.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const match = NEIGHBORHOODS.find(n => {
          const normalizedName = n.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName);
        });
        if (match) {
          matchedNeighborhoodId = match.id;
          break;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      // "map" → user clicked/dragged, update address + block re-geocoding
      // "geocode" → forward geocode result, DON'T overwrite the typed address
      addressSource: source === "map" ? "map" : "geocode",
      ...(source === "map" && addr ? { address: addr } : {}),
      ...(matchedNeighborhoodId ? { neighborhoodId: matchedNeighborhoodId } : {}),
    }));

    setFieldErrors((prev) => {
      const newErrors = { ...prev, address: undefined };
      if (matchedNeighborhoodId) {
        newErrors.neighborhoodId = undefined;
      }
      return newErrors;
    });
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      name: file.name,
      mimeType: file.type,
      size: file.size,
      file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm(formData, specificFields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      requestTypeCode: requestType.code,
      citizenId: null, // TODO: Obtener del módulo de autenticación
      isAnonymous: formData.isAnonymous,
      summary: formData.summary,
      description: formData.description,
      location: {
        address: formData.address,
        neighborhoodId: formData.neighborhoodId,
        latitude: formData.latitude,
        longitude: formData.longitude,
      },
      attachments: attachments.map((a) => ({
        name: a.name,
        mimeType: a.mimeType,
        url: "", // TODO: Subir archivos al storage
      })),
      specificData: formData.specificData,
    };

    console.log("[TicketForm] Payload a enviar al backend:", JSON.stringify(payload, null, 2));
    console.log("[TicketForm] Archivos adjuntos:", attachments);

    await submit(payload);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    handleSubmit({ preventDefault: () => { } });
  };

  // Cuando el formulario se envió exitosamente, avisar al padre que ya no está "dirty"
  // para que el modal de confirmación no aparezca al navegar hacia atrás.
  useEffect(() => {
    if (trackingCode && onDirtyChange) {
      onDirtyChange(false);
    }
  }, [trackingCode, onDirtyChange]);

  useEffect(() => {
    if (onStatusChange) {
      if (trackingCode) onStatusChange('success');
      else if (error) onStatusChange('error');
      else onStatusChange('idle');
    }
  }, [trackingCode, error, onStatusChange]);

  const isSubmitDisabled = loading || loadingFields ||
    !formData.latitude ||
    !formData.longitude ||
    Object.keys(validateForm(formData, specificFields)).length > 0;

  if (trackingCode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="flex flex-col items-center text-center py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6 shadow-lg shadow-emerald-500/20"
        >
          <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20"></div>
          <CheckCircle className="h-10 w-10 text-emerald-600" strokeWidth={2} />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-extrabold text-neutral-900 tracking-tight"
        >
          ¡Reclamo Registrado!
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 text-[15px] text-neutral-600 max-w-md leading-relaxed"
        >
          Tu solicitud ha sido ingresada exitosamente. Utilizá el siguiente código para consultar su estado en cualquier momento.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-8 py-5 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-emerald-100/40 to-emerald-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="text-[13px] text-emerald-600 font-semibold uppercase tracking-widest">
            Código de Seguimiento
          </span>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-emerald-700 font-mono tracking-widest bg-white px-4 py-2 rounded-lg shadow-sm">
              {trackingCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2.5 rounded-lg bg-white shadow-sm hover:bg-emerald-100 hover:text-emerald-700 transition-all active:scale-95"
              aria-label="Copiar código"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <Copy className="h-5 w-5 text-emerald-600" />
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            type="button"
            onClick={() => {
              reset();
              onNewTicket();
            }}
            className="group flex justify-center items-center gap-2 rounded-xl bg-[#0F2C59] px-6 py-3.5 text-[14px] font-semibold text-white
                       transition-all duration-300 hover:bg-[#1a3f7a] shadow-sm hover:shadow-md active:scale-95"
          >
            <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-180 duration-500" />
            Nuevo reclamo
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex justify-center items-center gap-2 rounded-xl bg-white border border-neutral-200 px-6 py-3.5 text-[14px] font-semibold text-neutral-600
                       transition-all duration-300 hover:bg-neutral-50 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-300" />
            Volver al inicio
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert
          variant="error"
          title="Error al enviar"
          onDismiss={reset}
          sticky
          autoDismissMs={10000}
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            <RotateCcw className="h-3 w-3" />
            Reintentar
          </button>
        </Alert>
      )}

      <div className="rounded-lg border border-[#0F2C59]/10 bg-[#0F2C59]/[0.02] p-4">
        <p className="text-[13px] font-medium text-[#0F2C59]">{requestType.name}</p>
        <p className="text-[12px] text-neutral-500 mt-0.5">{requestType.description}</p>
      </div>

      {/* Toggle anónimo */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3.5">
        <div className="flex items-center gap-2.5">
          <EyeOff className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          <div>
            <p className="text-[13px] font-medium text-neutral-700">Presentación anónima</p>
            <p className="text-[11px] text-neutral-400">Tus datos no serán visibles en el reclamo</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${formData.isAnonymous ? "bg-[#D63031]" : "bg-neutral-300"
            }`}
          role="switch"
          aria-checked={formData.isAnonymous}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.isAnonymous ? "translate-x-5" : "translate-x-0"
              }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-4 bg-[#D63031]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
            Descripción
          </span>
        </div>
        <FormField
          label="Título / Resumen"
          name="summary"
          type="smalltext"
          placeholder="Pon el título o un pequeño resumen de tu reclamo o solicitud..."
          value={formData.summary}
          onChange={handleChange}
          error={fieldErrors.summary}
          required
          disabled={loading}
        />
        <FormField
          label="Descripción detallada"
          name="description"
          type="textarea"
          placeholder="Describí con el mayor detalle posible tu reclamo o solicitud..."
          value={formData.description}
          onChange={handleChange}
          error={fieldErrors.description}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-4 bg-[#D63031]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
            Ubicación
          </span>
        </div>
        <FormField
          label="Dirección (calle y altura)"
          name="address"
          type="text"
          placeholder="Ej: Av. Santa Fe 1234"
          value={formData.address}
          onChange={handleChange}
          error={fieldErrors.address}
          required
          disabled={loading}
        />
        <FormField
          label="Barrio"
          name="neighborhoodId"
          type="searchable-select"
          options={NEIGHBORHOODS.map((n) => ({ value: n.id, label: n.name }))}
          value={formData.neighborhoodId}
          onChange={handleChange}
          error={fieldErrors.neighborhoodId}
          required
          disabled={loading}
        />
        <LocationMap
          address={formData.address}
          addressSource={formData.addressSource}
          latitude={formData.latitude}
          longitude={formData.longitude}
          onLocationSelect={handleLocationSelect}
          disabled={loading}
        />
      </div>

      {loadingFields ? (
        <div className="py-6 flex justify-center">
          <Spinner size="sm" />
        </div>
      ) : specificFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-4 bg-[#D63031]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
              Datos específicos
            </span>
          </div>
          {specificFields.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              name={`specific_${field.key}`}
              type={field.type}
              placeholder={field.placeholder}
              options={field.options || []}
              value={formData.specificData[field.key] || ""}
              onChange={handleSpecificChange}
              error={fieldErrors[`specific_${field.key}`]}
              required={field.required}
              disabled={loading}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-4 bg-[#D63031]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
            Archivos adjuntos
          </span>
          <span className="text-[10px] text-neutral-400">(opcional)</span>
        </div>

        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 
                      px-4 py-6 text-[13px] text-neutral-400 transition-colors hover:border-[#D63031]/30 hover:text-[#D63031]/70
                      ${loading ? "pointer-events-none opacity-50" : ""}`}
        >
          <Paperclip className="h-4 w-4" strokeWidth={1.5} />
          <span>Agregar fotos o documentos</span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        </label>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-600"
              >
                <Paperclip className="h-3 w-3 text-neutral-400" strokeWidth={1.5} />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="p-0.5 rounded hover:bg-neutral-100 transition-colors"
                  aria-label={`Eliminar ${file.name}`}
                >
                  <X className="h-3 w-3 text-neutral-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-600
                     transition-all hover:bg-neutral-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D63031] px-6 py-2.5 text-[13px] font-semibold text-white
                     transition-all duration-200 hover:bg-[#c0282a] hover:shadow-md hover:shadow-[#D63031]/15
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031] focus-visible:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="border-white/30 border-t-white" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Enviar solicitud
            </>
          )}
        </button>
      </div>
    </form>
  );
}
