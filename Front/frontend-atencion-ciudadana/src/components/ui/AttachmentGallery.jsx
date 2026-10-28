import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Eye, File, FileText, Image as ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { ATTACHMENT_ACCEPT, attachmentError } from "../../utils/attachments";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconForContentType(contentType) {
  if (contentType?.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf") return FileText;
  return File;
}

// HEIC/HEIF no se renderizan en la mayoría de los navegadores: sólo se descargan.
const PREVIEWABLE_IMAGES = ["image/jpeg", "image/png", "image/webp"];

function previewKind(contentType) {
  const type = contentType?.toLowerCase();
  if (PREVIEWABLE_IMAGES.includes(type)) return "image";
  if (type === "application/pdf") return "pdf";
  return null;
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "adjunto";
  link.click();
  URL.revokeObjectURL(url);
}

function AttachmentPreview({ attachment, url, onClose, onDownload }) {
  const kind = previewKind(attachment.contentType);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Vista previa de ${attachment.fileName}`}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-neutral-700">{attachment.fileName}</p>
          <button
            type="button"
            onClick={onDownload}
            aria-label={`Descargar ${attachment.fileName} desde la vista previa`}
            className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-[#0F2C59]"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-[#0F2C59]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-neutral-50">
          {kind === "pdf" ? (
            <iframe title={`PDF ${attachment.fileName}`} src={url} className="h-[75vh] w-full border-0" />
          ) : (
            <img src={url} alt={attachment.fileName} className="max-h-[75vh] max-w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}

function messageForUploadError(err) {
  if (err?.status === 413) return "El archivo supera el tamaño máximo permitido.";
  if (err?.status === 415) return "Ese tipo de archivo no está permitido.";
  if (err?.status === 403) return "No tenés permiso para adjuntar archivos a este ticket.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (err?.status === 503) return "El almacenamiento de adjuntos no está disponible en este momento. Intentá de nuevo más tarde.";
  return err?.message || "No pudimos subir el archivo. Intentá de nuevo.";
}

function messageForDownloadError(err) {
  if (err?.status === 404) return "No encontramos ese adjunto.";
  if (err?.status === 403) return "No tenés permiso para descargar este archivo.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos descargar el archivo.";
}

export default function AttachmentGallery({
  title = "Adjuntos",
  canUpload = false,
  accept = ATTACHMENT_ACCEPT,
  items,
  uploadFile,
  downloadFile,
}) {
  const [prevItems, setPrevItems] = useState(items);
  const [attachments, setAttachments] = useState(() => (Array.isArray(items) ? items : []));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const uploadInFlight = useRef(false);

  if (items !== prevItems) {
    setPrevItems(items);
    setAttachments(Array.isArray(items) ? items : []);
  }

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploadInFlight.current) return;
    const validation = attachmentError([file]);
    if (validation) { setUploadError(validation); return; }

    uploadInFlight.current = true;
    setUploading(true);
    setUploadError(null);
    try {
      const created = await uploadFile(file);
      setAttachments((prev) => [...prev, ...(Array.isArray(created) ? created : [created])]);
    } catch (err) {
      setUploadError(messageForUploadError(err));
    } finally {
      uploadInFlight.current = false;
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    setDownloadingId(attachment.id);
    setDownloadError(null);
    try {
      saveBlob(await downloadFile(attachment), attachment.fileName);
    } catch (err) {
      setDownloadError(messageForDownloadError(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (attachment) => {
    setPreviewingId(attachment.id);
    setDownloadError(null);
    try {
      const blob = await downloadFile(attachment);
      // El tipo se fuerza al declarado: el visor no debe confiar en el que informe el servidor.
      const typed = new Blob([blob], { type: attachment.contentType });
      setPreview({ attachment, blob: typed, url: URL.createObjectURL(typed) });
    } catch (err) {
      setDownloadError(messageForDownloadError(err));
    } finally {
      setPreviewingId(null);
    }
  };

  const closePreview = () => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  return (
    <div>
      {(title || canUpload) && (
        <div className="flex items-center justify-between gap-2">
          {title && <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{title}</p>}
          {canUpload && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-[#0F2C59] hover:underline">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
              {uploading ? "Subiendo…" : "Adjuntar archivo"}
              <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelected} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>
      )}

      <div className="mt-2.5">
        {attachments.length === 0 ? (
          <p className="text-[12.5px] text-neutral-400">No hay adjuntos en este ticket.</p>
        ) : (
          <ul className="space-y-1.5">
            {attachments.map((attachment) => {
              const Icon = iconForContentType(attachment.contentType);
              return (
                <li
                  key={attachment.id}
                  className="flex items-center gap-2.5 rounded-md border border-neutral-200 bg-white px-2.5 py-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-neutral-700">{attachment.fileName}</p>
                    <p className="text-[11px] text-neutral-400">{formatBytes(attachment.sizeBytes)}</p>
                  </div>
                  {previewKind(attachment.contentType) && (
                    <button
                      type="button"
                      onClick={() => handlePreview(attachment)}
                      disabled={previewingId === attachment.id}
                      aria-label={`Ver ${attachment.fileName}`}
                      className="shrink-0 rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-[#0F2C59] disabled:cursor-wait disabled:opacity-50"
                    >
                      {previewingId === attachment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(attachment)}
                    disabled={downloadingId === attachment.id}
                    aria-label={`Descargar ${attachment.fileName}`}
                    className="shrink-0 rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-[#0F2C59] disabled:cursor-wait disabled:opacity-50"
                  >
                    {downloadingId === attachment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {preview && (
        <AttachmentPreview
          attachment={preview.attachment}
          url={preview.url}
          onClose={closePreview}
          onDownload={() => saveBlob(preview.blob, preview.attachment.fileName)}
        />
      )}

      {uploadError && (
        <p className="mt-2 flex items-start gap-1.5 text-[12px] text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {uploadError}
        </p>
      )}
      {downloadError && (
        <p className="mt-2 flex items-start gap-1.5 text-[12px] text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {downloadError}
        </p>
      )}
    </div>
  );
}
