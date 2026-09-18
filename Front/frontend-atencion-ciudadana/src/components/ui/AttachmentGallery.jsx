import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, File, FileText, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";

const DEFAULT_ACCEPT = "image/*,.pdf,.doc,.docx";

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

function messageForListError(err) {
  if (err?.status === 404) {
    return "El back todavía no tiene el endpoint de adjuntos para este ticket — queda preparado para cuando esté listo.";
  }
  if (err?.status === 403) return "No tenés permiso para ver los adjuntos de este ticket.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos cargar los adjuntos.";
}

function messageForUploadError(err) {
  if (err?.status === 404) {
    return "El back todavía no tiene el endpoint para subir adjuntos — queda preparado para cuando esté listo.";
  }
  if (err?.status === 413) return "El archivo supera el tamaño máximo permitido.";
  if (err?.status === 415) return "Ese tipo de archivo no está permitido.";
  if (err?.status === 403) return "No tenés permiso para adjuntar archivos a este ticket.";
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
  fetchList,
  uploadFile,
  downloadFile,
}) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const list = await fetchList();
      setAttachments(Array.isArray(list) ? list : []);
    } catch (err) {
      setListError(messageForListError(err));
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const created = await uploadFile(file);
      if (created) setAttachments((prev) => [...prev, created]);
      else await load();
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
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
          </div>
        ) : listError ? (
          <p className="flex items-start gap-1.5 text-[12px] text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {listError}
          </p>
        ) : attachments.length === 0 ? (
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
