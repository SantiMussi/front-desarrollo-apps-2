import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Eye,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  MapPin,
  Tag,
  Info,
  Send,
  Star,
  Trash2,
  TriangleAlert,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  TICKET_STATUS_LABELS,
  statusTone,
  TERMINAL_STATUSES,
} from "../../constants/ticketStatuses";
import AttachmentGallery from "../ui/AttachmentGallery";

const dateTime = (v) =>
  v
    ? new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";

const dateOnly = (v) =>
  v
    ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(v)
      )
    : "—";

const shortId = (publicId) => `#${String(publicId).replace(/\D/g, "").replace(/^0+/, "") || publicId}`;

function wasMessageEdited(message) {
  if (!message.updatedAt) return false;
  return new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 1000;
}

const AUTHOR_TYPE_LABELS = {
  AGENT: "Atención Vecinal",
  ADMIN: "Administración municipal",
  AREA_RESPONSIBLE: "Área responsable",
  CITIZEN: "Vecino",
};

const TICKET_TYPE_CONFIG = {
  COMPLAINT: { label: "Reclamo", icon: TriangleAlert, className: "text-red-600 bg-red-50" },
  REQUEST: { label: "Solicitud", icon: Plus, className: "text-blue-600 bg-blue-50" },
  INQUIRY: { label: "Pregunta", icon: CircleHelp, className: "text-amber-600 bg-amber-50" },
  SUGGESTION: { label: "Sugerencia", icon: Lightbulb, className: "text-emerald-600 bg-emerald-50" },
};

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="text-right text-[13px] font-medium text-neutral-700">{value || "—"}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white ${className}`}>
      {title && (
        <header className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
          {Icon && <Icon className="h-4 w-4 text-[#D63031]" strokeWidth={2} />}
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {title}
          </h2>
        </header>
      )}
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function StatusPill({ status }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {TICKET_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function StatusHistory({ history }) {
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-neutral-200" aria-hidden />
      {history.map((h, i) => {
        const last = i === history.length - 1;
        const tone = statusTone(h.newStatus);
        return (
          <li key={h.id} className="relative">
            <span
              className={`absolute -left-5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                last ? tone.dot : "bg-neutral-300"
              }`}
            />
            <p className="text-[13px] font-semibold text-neutral-800">
              {TICKET_STATUS_LABELS[h.newStatus] ?? h.newStatus}
            </p>
            <p className="text-[12px] text-neutral-400">{dateTime(h.occurredAt)}</p>
            {h.message && <p className="mt-0.5 text-[12.5px] text-neutral-600">{h.message}</p>}
          </li>
        );
      })}
    </ol>
  );
}

function AttentionRating({ value, onRate, loading, error }) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (value) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800">
        ¡Gracias por tu opinión! Calificaste la atención con {value}/5.
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selected) return;
    onRate(selected, comment.trim());
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-neutral-700">¿Cómo calificarías la atención?</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 text-neutral-400 hover:text-neutral-600"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-0.5 text-[11.5px] text-neutral-400">
        Tu opinión ayuda a mejorar los servicios de la ciudad.
      </p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => setSelected(n)}
            disabled={loading}
            aria-label={`${n} estrellas`}
            className="p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star
              className={`h-6 w-6 ${
                n <= (hover || selected) ? "fill-amber-400 text-amber-400" : "text-neutral-300"
              }`}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Contanos más sobre tu experiencia (opcional)…"
            disabled={loading}
            className="mt-2.5 w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-[12.5px] text-neutral-800 outline-none focus:ring-2 focus:ring-amber-200"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#1a3f7a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar calificación"}
          </button>
        </>
      )}
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

export default function CitizenTicketView({
  ticket,
  readOnly = false,
  backTo,
  backLabel,
  actions,
  actionLoading = false,
  actionError = null,
  attachments: attachmentsAdapter,
  chat,
}) {
  const [reopenMode, setReopenMode] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [infoResponse, setInfoResponse] = useState("");
  const [infoResponseFiles, setInfoResponseFiles] = useState([]);

  const isResolved = ticket.currentStatus === "RESOLVED";
  const isPendingInformation = ticket.currentStatus === "PENDING_INFORMATION";
  const messages = chat?.items ?? [];
  const chatAvailable = Boolean(chat);
  const chatDisabledByStatus = TERMINAL_STATUSES.has(ticket.currentStatus) || ticket.currentStatus === "RESOLVED";
  const canType = !readOnly && chatAvailable && chat?.canSend && !chatDisabledByStatus;

  const handleConfirm = () => actions?.confirmResolution();

  const handleReopen = async () => {
    const ok = await actions?.requestReopen(reopenReason.trim());
    if (ok) {
      setReopenMode(false);
      setReopenReason("");
    }
  };

  const handleAnswerInformation = async () => {
    const text = infoResponse.trim();
    if (!text && infoResponseFiles.length === 0) return;
    const ok = await actions?.answerInformation(text || null, infoResponseFiles);
    if (ok) {
      setInfoResponse("");
      setInfoResponseFiles([]);
    }
  };

  const handleInfoResponseFilesSelected = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) setInfoResponseFiles((prev) => [...prev, ...files]);
  };

  const removeInfoResponseFile = (index) => {
    setInfoResponseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRate = (score, comment) => actions?.rateAttention(score, comment);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !canType || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await chat.onSend(text);
      setDraft("");
    } catch (err) {
      setSendError(chat?.messageForError ? chat.messageForError(err) : err?.message || "No pudimos enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const startEdit = (message) => {
    setEditingId(message.id);
    setEditText(message.text);
    setSendError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (messageId) => {
    const text = editText.trim();
    if (!text || savingEdit) return;
    setSavingEdit(true);
    try {
      await chat.onEdit(messageId, text);
      setEditingId(null);
      setEditText("");
    } catch (err) {
      setSendError(chat?.messageForError ? chat.messageForError(err) : err?.message || "No pudimos editar el mensaje.");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async (messageId) => {
    setDeletingId(messageId);
    try {
      await chat.onDelete(messageId);
      setConfirmDeleteId(null);
    } catch (err) {
      setSendError(chat?.messageForError ? chat.messageForError(err) : err?.message || "No pudimos borrar el mensaje.");
    } finally {
      setDeletingId(null);
    }
  };

  const typeConfig = TICKET_TYPE_CONFIG[ticket.ticketType];
  const TypeIcon = typeConfig?.icon;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 hover:text-[#0F2C59]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      )}

      {readOnly && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-900">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          Vista de solo lectura: es exactamente lo que ve el informante. No podés escribir mensajes ni tomar acciones desde acá.
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            {typeConfig && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeConfig.className}`}
              >
                <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} />
                {typeConfig.label}
              </span>
            )}
            <span className="font-mono text-[12px] text-neutral-400">Ticket {shortId(ticket.publicId)}</span>
          </div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight text-[#0F2C59]">
            {ticket.summary}
          </h1>
        </div>
        <StatusPill status={ticket.currentStatus} />
      </div>

      {/* Banner de confirmación / reapertura (solo en RESOLVED) */}
      {isResolved && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 overflow-hidden rounded-xl bg-[#0F2C59] text-white"
        >
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-[14px] font-semibold">
                  El municipio marcó este reclamo como Resuelto.
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-blue-100">
                  {readOnly
                    ? "El ciudadano puede confirmar si el problema fue solucionado, o reabrir el reclamo si persiste."
                    : "Revisá la solución y confirmá si el problema fue solucionado, o reabrí el reclamo si persiste."}
                  {ticket.resolutionConfirmationDueAt && (
                    <>
                      {" "}
                      Si no respond{readOnly ? "e" : "és"} antes del{" "}
                      <strong className="text-white">
                        {dateOnly(ticket.resolutionConfirmationDueAt)}
                      </strong>
                      , se cerrará automáticamente.
                    </>
                  )}
                </p>
              </div>
            </div>
            {!readOnly && !reopenMode && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D63031] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#c0282a] disabled:opacity-60"
                >
                  {actionLoading ? (
                    <Info className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar solución
                </button>
                <button
                  type="button"
                  onClick={() => setReopenMode(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reabrir ticket
                </button>
              </div>
            )}
          </div>

          {!readOnly && reopenMode && (
            <div className="border-t border-white/10 bg-white/[0.04] px-5 py-4">
              <label className="block text-[12.5px] font-medium text-blue-100">
                Contanos por qué el problema continúa <span className="text-blue-200/70">*</span>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={2}
                  placeholder="Ej.: el bache volvió a aparecer con la lluvia…"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/95 px-3 py-2 text-[13px] text-neutral-800 outline-none focus:ring-2 focus:ring-white/40"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={actionLoading || !reopenReason.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D63031] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#c0282a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? <Info className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Confirmar reapertura
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReopenMode(false);
                    setReopenReason("");
                  }}
                  disabled={actionLoading}
                  className="rounded-lg border border-white/25 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!readOnly && actionError && (
            <div className="border-t border-white/10 bg-red-500/15 px-5 py-2.5 text-[12.5px] text-red-100">
              {actionError}
            </div>
          )}
        </motion.div>
      )}

      {isPendingInformation && (
        <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3 px-5 py-4">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-[14px] font-semibold text-amber-900">
                El municipio te pidió información adicional.
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-800">
                {ticket.pendingInformationRequest?.messageForCitizen ||
                  (readOnly
                    ? "El ciudadano necesita responder para que el trámite continúe."
                    : "Respondé para que podamos continuar con el trámite.")}
              </p>
              {ticket.pendingInformationRequest?.dueAt && (
                <p className="mt-1 text-[11.5px] font-medium text-amber-700">
                  Plazo para responder: {dateTime(ticket.pendingInformationRequest.dueAt)}
                </p>
              )}
            </div>
          </div>
          {!readOnly && (
            <div className="border-t border-amber-200 bg-white/60 px-5 py-4">
              <label className="block text-[12.5px] font-medium text-amber-900">
                Tu respuesta
                <textarea
                  value={infoResponse}
                  onChange={(e) => setInfoResponse(e.target.value)}
                  rows={2}
                  placeholder="Escribí la información solicitada…"
                  className="mt-1.5 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[13px] text-neutral-800 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-[#0F2C59] hover:underline">
                <Plus className="h-3.5 w-3.5" />
                Adjuntar archivo
                <input type="file" onChange={handleInfoResponseFilesSelected} className="hidden" />
              </label>
              {infoResponseFiles.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {infoResponseFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-700"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeInfoResponseFile(index)}
                        className="shrink-0 text-neutral-400 hover:text-red-600"
                        aria-label={`Quitar ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={handleAnswerInformation}
                disabled={actionLoading || (!infoResponse.trim() && infoResponseFiles.length === 0)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1a3f7a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? <Info className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar respuesta
              </button>
              {actionError && (
                <p className="mt-2 text-[12.5px] text-red-700">{actionError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {ticket.currentStatus === "CLOSED" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {readOnly ? "El ciudadano confirmó la solución. El reclamo quedó cerrado." : "Confirmaste la solución. El reclamo quedó cerrado."}
        </div>
      )}

      {/* Contenido */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card title="Descripción del problema">
            <p className="text-[13.5px] leading-relaxed text-neutral-600">{ticket.description || "Descripción no disponible."}</p>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card title="Categoría" icon={Tag}>
              <Row label="Tipo de solicitud" value={ticket.requestType?.name} />
              <Row label="Categoría" value={ticket.category?.name} />
              <Row label="Subcategoría" value={ticket.subcategory?.name} />
            </Card>
            <Card title="Ubicación y fechas" icon={MapPin}>
              <Row
                label="Barrio"
                value={
                  ticket.location?.addressLine || ticket.neighborhoodName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {ticket.location?.addressLine || ticket.neighborhoodName}
                    </span>
                  ) : null
                }
              />
              <Row
                label="Fecha de ingreso"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                    {dateOnly(ticket.createdAt)}
                  </span>
                }
              />
              <Row label="Última actualización" value={dateTime(ticket.statusChangedAt)} />
            </Card>
          </div>

          <Card>
            <AttachmentGallery
              title="Adjuntos"
              canUpload={!readOnly && Boolean(attachmentsAdapter?.canUpload)}
              items={ticket.attachments}
              uploadFile={attachmentsAdapter?.uploadFile}
              downloadFile={attachmentsAdapter?.downloadFile}
            />
          </Card>

          <Card title="Historial de estados">
            <StatusHistory history={ticket.history} />
          </Card>
        </div>

        {/* Mensajes */}
        <Card title="Mensajes" className="flex h-fit flex-col">
          <div className="space-y-3">
            {chat?.loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
              </div>
            ) : chat?.error ? (
              <p className="py-4 text-center text-[12.5px] text-red-600">{chat.error}</p>
            ) : messages.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-neutral-400">
                Todavía no hay mensajes en este reclamo.
              </p>
            ) : (
              messages.map((m) => {
                if (m.authorType === "SYSTEM") {
                  return (
                    <div key={m.id} className="flex items-center justify-center gap-2 py-1 text-center text-[11px] italic text-neutral-400">
                      <span>{m.text}</span>
                      <span className="text-neutral-300">·</span>
                      <span>{dateTime(m.createdAt)}</span>
                    </div>
                  );
                }
                const mine = chat?.currentAuthorId
                  ? m.authorId === chat.currentAuthorId
                  : m.authorType === "CITIZEN";
                const canModify = !readOnly && mine && chat?.onEdit && chat?.onDelete;
                const isEditing = editingId === m.id;
                const isConfirmingDelete = confirmDeleteId === m.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed ${
                        mine
                          ? "rounded-br-sm bg-neutral-100 text-neutral-700"
                          : "rounded-bl-sm bg-[#0F2C59] text-white"
                      }`}
                    >
                      {!mine && (
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                          {AUTHOR_TYPE_LABELS[m.authorType] || "Atención Vecinal"}
                        </p>
                      )}
                      {isEditing ? (
                        <div className="min-w-[200px]">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            autoFocus
                            className="w-full resize-none rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-[12.5px] text-neutral-800 outline-none focus:ring-2 focus:ring-[#0F2C59]/20"
                          />
                          <div className="mt-1.5 flex justify-end gap-2 text-[11px] font-semibold">
                            <button type="button" onClick={cancelEdit} className="text-neutral-500 hover:underline">
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit(m.id)}
                              disabled={!editText.trim() || savingEdit}
                              className="text-[#0F2C59] hover:underline disabled:opacity-50"
                            >
                              {savingEdit ? "Guardando…" : "Guardar"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{m.text}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <p className={`text-[10px] ${mine ? "text-neutral-400" : "text-blue-200/80"}`}>
                          {dateTime(m.createdAt)}
                          {wasMessageEdited(m) ? " (editado)" : ""}
                        </p>
                        {canModify && !isEditing && !isConfirmingDelete && (
                          <span className="ml-auto flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="text-neutral-400 hover:text-[#0F2C59]"
                              aria-label="Editar mensaje"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(m.id)}
                              className="text-neutral-400 hover:text-red-600"
                              aria-label="Borrar mensaje"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </div>
                      {isConfirmingDelete && (
                        <div className="mt-1.5 flex items-center justify-end gap-2 text-[11px] font-semibold">
                          <span className="text-neutral-500">¿Borrar este mensaje?</span>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-neutral-500 hover:underline">
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(m.id)}
                            disabled={deletingId === m.id}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingId === m.id ? "Borrando…" : "Sí, borrar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!readOnly && ticket.currentStatus === "CLOSED" && (
            <div className="mt-4">
              <AttentionRating value={ticket.rating} onRate={handleRate} loading={actionLoading} error={actionError} />
            </div>
          )}

          <div className="mt-4 border-t border-neutral-100 pt-3">
            {readOnly ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-center text-[11.5px] text-neutral-400">
                No podés enviar mensajes desde la vista de solo lectura.
              </p>
            ) : !chatAvailable ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-center text-[11.5px] text-neutral-400">
                El chat todavía no está disponible para el seguimiento anónimo.
              </p>
            ) : chatDisabledByStatus ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-center text-[11.5px] text-neutral-400">
                El chat está deshabilitado porque el reclamo está{" "}
                {(TICKET_STATUS_LABELS[ticket.currentStatus] ?? ticket.currentStatus).toLowerCase()}.
              </p>
            ) : (
              <div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    disabled={sending}
                    placeholder="Escribí un mensaje…"
                    className="flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#D63031]/40 focus:ring-2 focus:ring-[#D63031]/10"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!draft.trim() || sending}
                    className="rounded-lg bg-[#0F2C59] p-2 text-white transition hover:bg-[#1a3f7a] disabled:opacity-40"
                    aria-label="Enviar mensaje"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                {sendError && <p className="mt-2 text-[12px] text-red-600">{sendError}</p>}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
