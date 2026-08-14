import { useState } from "react";
import { Send, RotateCcw, ArrowLeft, Copy, CheckCircle, Paperclip, X, EyeOff } from "lucide-react";
import FormField from "./FormField";
import Spinner from "./Spinner";
import Alert from "./Alert";
import { useCreateTicket } from "../../hooks/useCreateTicket";
import { NEIGHBORHOODS } from "../../data/mockCategories";

function validateForm(formData, specificFields) {
  const errors = {};

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

  specificFields.forEach((field) => {
    if (field.required && !formData.specificData[field.key]) {
      errors[`specific_${field.key}`] = `${field.label} es obligatorio`;
    }
  });

  return errors;
}

export default function TicketForm({ requestType, onBack, onNewTicket }) {
  const { submit, loading, error, trackingCode, reset } = useCreateTicket();
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    address: "",
    neighborhoodId: "",
    isAnonymous: false,
    specificData: {},
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [attachments, setAttachments] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    const errors = validateForm(formData, requestType.specificFields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      requestTypeCode: requestType.code,
      citizenId: null, // TODO: Obtener del módulo de autenticación
      isAnonymous: formData.isAnonymous,
      description: formData.description,
      location: {
        address: formData.address,
        neighborhoodId: formData.neighborhoodId,
        latitude: null,
        longitude: null,
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
    reset();
  };

  if (trackingCode) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-5">
          <CheckCircle className="h-8 w-8 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-neutral-900">¡Solicitud registrada!</h3>
        <p className="mt-2 text-[14px] text-neutral-500 max-w-md">
          Tu reclamo fue registrado exitosamente. Usá el código de seguimiento para consultar el estado en cualquier momento.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3">
          <span className="text-[13px] text-emerald-600 font-medium">Código:</span>
          <span className="text-lg font-bold text-emerald-700 font-mono tracking-wider">
            {trackingCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="ml-2 p-1 rounded hover:bg-emerald-100 transition-colors"
            aria-label="Copiar código"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4 text-emerald-500" />
            )}
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              onNewTicket();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-5 py-2.5 text-[13px] font-semibold text-white
                       transition-all duration-200 hover:bg-[#1a3f7a]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nuevo reclamo
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" title="Error al enviar" onDismiss={handleRetry}>
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
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
            formData.isAnonymous ? "bg-[#D63031]" : "bg-neutral-300"
          }`}
          role="switch"
          aria-checked={formData.isAnonymous}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              formData.isAnonymous ? "translate-x-5" : "translate-x-0"
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
          type="select"
          options={NEIGHBORHOODS.map((n) => ({ value: n.id, label: n.name }))}
          value={formData.neighborhoodId}
          onChange={handleChange}
          error={fieldErrors.neighborhoodId}
          required
          disabled={loading}
        />
      </div>

      {requestType.specificFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-4 bg-[#D63031]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
              Datos específicos
            </span>
          </div>
          {requestType.specificFields.map((field) => (
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
          disabled={loading}
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
