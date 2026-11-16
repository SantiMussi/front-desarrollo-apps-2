export const ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
export const ATTACHMENT_ACCEPT = ATTACHMENT_TYPES.join(",");
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
export const MAX_FILES = 5;

// Metadata checks provide early feedback. The server also checks actual content.
export function attachmentError(files) {
  if (files.length > MAX_FILES) return "Podés adjuntar hasta cinco archivos por carga.";
  let total = 0;
  for (const entry of files) {
    const file = entry.file ?? entry;
    if (!ATTACHMENT_TYPES.includes(file.type.trim().toLowerCase())) return "Formato no admitido. Usá JPEG, PNG, WebP, HEIC, HEIF o PDF.";
    if (file.size <= 0) return "Los archivos adjuntos no pueden estar vacíos.";
    if (file.size > MAX_FILE_BYTES) return "Cada archivo puede pesar hasta 10 MiB.";
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) return "Los adjuntos pueden pesar hasta 50 MiB en total.";
  return null;
}
