import { useRef, useState } from "react";
import { AlertCircle, Download, File, FileText, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";

// Debe reflejar exactamente attachment.allowed-content-types del back
// (application.properties) — hoy no incluye .doc/.docx, el back los rechaza con 415.
const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf";

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
  accept = DEFAULT_ACCEPT,
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
  const fileInputRef = useRef(null);

  if (items !== prevItems) {
    setPrevItems(items);
    setAttachments(Array.isArray(items) ? items : []);
  }

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const created = await uploadFile(file);
      setAttachments((prev) => [...prev, ...(Array.isArray(created) ? created : [created])]);
    } catch (err) {
      setUploadError(messageForUploadError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    setDownloadingId(attachment.id);
    setDownloadError(null);
    try {
      const blob = await downloadFile(attachment);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName || "adjunto";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(messageForDownloadError(err));
    } finally {
      setDownloadingId(null);
    }
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
