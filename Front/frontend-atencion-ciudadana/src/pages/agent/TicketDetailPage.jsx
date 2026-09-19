import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, CircleHelp, Clock3, Eye, FileQuestion, Lightbulb, Loader2, MapPin, Paperclip, Plus, Send, Smile, TriangleAlert, Users } from "lucide-react";
import DetailCard from "../../components/ui/DetailCard";
import Select from "../../components/ui/Select";
import StatusTransitionMenu from "../../components/ui/StatusTransitionMenu";
import TicketTransitionDialog from "../../components/ui/TicketTransitionForm";
import ResolveTicketDialog from "../../components/ui/ResolveTicketDialog";
import RequestInformationDialog from "../../components/ui/RequestInformationDialog";
import TicketReasonDialog from "../../components/ui/TicketReasonDialog";
import DuplicateLinkDialog from "../../components/ui/DuplicateLinkDialog";
import DuplicateLinkIndicator from "../../components/ui/DuplicateLinkIndicator";
import AttachmentGallery from "../../components/ui/AttachmentGallery";
import UserAvatar from "../../components/ui/UserAvatar";
import { RESPONSIBLE_AREAS } from "../../constants/responsibleAreas";
import { CANCELLATION_REASONS } from "../../constants/cancellationReasons";
import { useResolveTicket } from "../../hooks/useResolveTicket";
import { useRequestTicketInformation } from "../../hooks/useRequestTicketInformation";
import { useStaffTicketDetail } from "../../hooks/useStaffTicketDetail";
import { useRequestTypesCatalog } from "../../hooks/useRequestTypesCatalog";
import { reviewTicket, updateTicketClassification, routeTicket, startTicketWork, returnTicketToAgent, rejectTicket, cancelTicket, linkTicketDuplicate, uploadTicketAttachment, downloadTicketAttachment } from "../../services/apiClient";
import { getSlaIndicator } from "../../utils/ticketIndicators";
import { getDuplicateLinkInfo } from "../../utils/duplicateLink";

function reviewErrorMessage(err) {
  if (err?.status === 409) return err?.message || "El ticket ya no está en un estado que permita iniciar el análisis.";
  if (err?.status === 404) return "No encontramos el ticket.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos iniciar el análisis. Intentá de nuevo.";
}

function classificationErrorMessage(err) {
  if (err?.status === 409) return err?.message || "El ticket ya no permite corregir la clasificación.";
  if (err?.status === 400) return err?.message || "Ese tipo de solicitud no es válido.";
  if (err?.status === 404) return "No encontramos el ticket.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos corregir la clasificación. Intentá de nuevo.";
}

function reasonConfirmErrorMessage(err) {
  if (err?.status === 409) return err?.message || "El ticket ya no permite esta acción.";
  if (err?.status === 400) return err?.message || "Faltan datos obligatorios.";
  if (err?.status === 403) return "No tenés permiso para realizar esta acción.";
  if (err?.status === 404) return "No encontramos el ticket.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return "No pudimos registrar la acción. Intentá de nuevo más tarde.";
}

function duplicateLinkErrorMessage(err) {
  if (err?.status === 404) return "El back todavía no tiene el endpoint para vincular duplicados — queda preparado para cuando esté listo.";
  if (err?.status === 409) return err?.message || "El ticket ya no permite vincularse como duplicado.";
  if (err?.status === 400) return err?.message || "No pudimos vincular estos tickets; revisá la selección.";
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  return err?.message || "No pudimos vincular el ticket. Intentá de nuevo.";
}

const PRIORITY = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };
const TICKET_TYPE_CONFIG = {
  COMPLAINT: { label: "Complaint", icon: TriangleAlert, className: "text-red-600 bg-red-50" },
  REQUEST: { label: "Request", icon: Plus, className: "text-blue-600 bg-blue-50" },
  INQUIRY: { label: "Question", icon: CircleHelp, className: "text-amber-600 bg-amber-50" },
  SUGGESTION: { label: "Suggestion", icon: Lightbulb, className: "text-emerald-600 bg-emerald-50" }
};
const formatDate = (value) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const REASON_DIALOG_CONFIG = {
  return: {
    eyebrow: "Devolución",
    title: "Devolver a revisión",
    description: "El ticket vuelve a En revisión para que el agente lo reclasifique o derive de nuevo.",
    confirmLabel: "Confirmar devolución",
    reasonOptions: undefined,
    danger: false,
  },
  reject: {
    eyebrow: "Cancelación",
    title: "Rechazar / cancelar solicitud",
    description: "El ticket pasa a Cancelado.",
    confirmLabel: "Confirmar cancelación",
    reasonOptions: CANCELLATION_REASONS,
    danger: true,
  },
  cancel: {
    eyebrow: "Cancelación",
    title: "Cancelar ticket",
    description: "El ticket pasa a Cancelado antes de ser derivado a un área.",
    confirmLabel: "Confirmar cancelación",
    reasonOptions: CANCELLATION_REASONS,
    danger: true,
  },
};

const COMPLETED_SLA_STATUSES = new Set(["RESOLVED", "CLOSED", "CANCELLED"]);

function formatSlaCountdown(dueAt, now) {
  const dueTime = dueAt ? new Date(dueAt).getTime() : NaN;
  if (!Number.isFinite(dueTime)) return null;

  const difference = dueTime - now;
  const totalHours = Math.floor(Math.abs(difference) / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return {
    overdue: difference < 0,
    label: `${days} ${days === 1 ? "día" : "días"} y ${hours} ${hours === 1 ? "hora" : "horas"}`,
  };
}

const ACTIVITY_TYPE_LABELS = {
  TICKET_CREATED: "Ticket creado",
  REVIEW_STARTED: "Análisis iniciado",
  STATE_CHANGED: "Estado actualizado",
  REQUEST_TYPE_CHANGED: "Clasificación corregida",
  ROUTED: "Derivado al área",
  RETURNED_BY_AREA: "Devuelto por el área",
  PRIORITY_CHANGED: "Prioridad actualizada",
  SLA_NEAR_DUE: "SLA próximo a vencer",
  SLA_BREACHED: "SLA vencido",
  ESCALATED: "Ticket escalado",
  INFORMATION_REQUIRED: "Información solicitada al ciudadano",
  INFORMATION_PROVIDED: "El ciudadano respondió",
  PROGRESS_REPORTED: "Progreso informado por el área",
  DUPLICATE_LINKED: "Vinculado como duplicado",
  RESOLVED: "Ticket resuelto",
  REOPENED: "Ticket reabierto",
  CANCELLATION_REQUESTED: "Cancelación solicitada",
  CANCELLATION_APPROVED: "Cancelación aprobada",
  CANCELLATION_REJECTED: "Cancelación rechazada",
  CANCELLED: "Ticket cancelado",
  CLOSED: "Ticket cerrado",
  PUBLIC_MESSAGE_SENT: "Mensaje enviado al ciudadano",
  INTERNAL_MESSAGE_ADDED: "Nota interna agregada",
  ATTACHMENT_ADDED: "Adjunto agregado",
};

function activityMessage(activity) {
  const parts = [ACTIVITY_TYPE_LABELS[activity.actionType] || activity.actionType];
  if (activity.message) parts.push(`"${activity.message}"`);
  if (activity.reasonCode) parts.push(`(motivo: ${activity.reasonCode})`);
  return parts.join(" — ");
}

function Field({ label, children }) {
  return <div className="grid grid-cols-[118px_1fr] gap-3 py-2.5 text-xs"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 font-medium text-slate-700">{children}</dd></div>;
}

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { ticket, loading, error, reload } = useStaffTicketDetail(ticketId);
  const [status, setStatus] = useState(null);
  const [tab, setTab] = useState("activity");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [comment, setComment] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const [fields, setFields] = useState(null);
  const [derivationOpen, setDerivationOpen] = useState(false);
  const [derivationLoading, setDerivationLoading] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [infoRequestOpen, setInfoRequestOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [startWorkLoading, setStartWorkLoading] = useState(false);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [reasonDialog, setReasonDialog] = useState(null);
  const [reasonLoading, setReasonLoading] = useState(false);
  const [reasonError, setReasonError] = useState(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);
  const { resolve, resolveSimulated, loading: resolving, error: resolveError, reset: resetResolve } = useResolveTicket();
  const { requestTypes } = useRequestTypesCatalog();
  const { requestInformation, loading: infoRequestLoading, error: infoRequestError, reset: resetInfoRequest } = useRequestTicketInformation();
  const [now, setNow] = useState(() => Date.now());

  const [ticketIdForFields, setTicketIdForFields] = useState(null);
  if (ticket && ticket.id !== ticketIdForFields) {
    setTicketIdForFields(ticket.id);
    setStatus(ticket.currentStatus);
    setFields({
      responsibleAreaId: ticket.responsibleAreaId,
      assignedAgentId: ticket.assignedAgentId ?? "",
      priority: ticket.currentPriority,
      affectedCount: ticket.estimatedAffectedCount ?? 0,
    });
  }

  const data = useMemo(() => {
    if (!ticket) return null;
    return {
      category: ticket.categoryName ? { name: ticket.categoryName } : null,
      subcategory: ticket.subcategoryName ? { name: ticket.subcategoryName } : null,
      citizen: ticket.anonymous ? { name: "Anónimo", initials: "AN" } : { name: "Ciudadano registrado", initials: "—" },
      assignee: ticket.assignedAgentId ? { name: `Agente #${ticket.assignedAgentId}`, initials: "AG" } : { name: "Sin asignar", initials: "—" },
      neighborhood: ticket.neighborhoodName || null,
      messages: [],
      activities: Array.isArray(ticket.ticketActivities)
        ? ticket.ticketActivities.map((activity) => ({
            id: `activity-${activity.sequence}`,
            message: activityMessage(activity),
            occurredAt: activity.occurredAt,
          }))
        : [],
    };
  }, [ticket]);

  const slaIndicator = getSlaIndicator(ticket);
  const duplicateLinkInfo = getDuplicateLinkInfo(ticket);
  const escalated = ticket?.escalated === true;
  const slaDueAt = ticket?.resolutionDueAt;
  const slaCountdown = formatSlaCountdown(slaDueAt, now);
  const currentTicketStatus = status ?? ticket?.currentStatus;
  const slaCompleted = COMPLETED_SLA_STATUSES.has(currentTicketStatus);
  const slaCompletionWasCancellation = currentTicketStatus === "CANCELLED";
  const slaCompletionAt = ticket?.statusChangedAt ?? ticket?.updatedAt;
  const firstResponseDueAt = ticket?.firstResponseDueAt;
  const firstResponseCountdown = formatSlaCountdown(firstResponseDueAt, now);
  const firstResponseOverdue = ticket?.firstResponseBreached === true || firstResponseCountdown?.overdue;

  useEffect(() => {
    if (!slaDueAt && !firstResponseDueAt) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, [firstResponseDueAt, slaDueAt]);

  const submit = () => {
    if (!comment.trim()) return;
    setLocalMessages((items) => [...items, { id: `local-${Date.now()}`, text: comment, visibility, createdAt: new Date().toISOString(), authorType: "AGENT" }]);
    setComment("");
  };

  const startReview = async () => {
    if (reviewLoading) return;
    setReviewLoading(true);
    setTransitionError(null);
    try {
      const updated = await reviewTicket(ticket.id);
      setStatus(updated.currentStatus);
      setFields((current) => ({ ...current, assignedAgentId: updated.assignedAgentId ?? current.assignedAgentId }));
      reload();
    } catch (err) {
      setTransitionError(reviewErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  };

  const classificationLocked = Boolean(ticket?.classificationFinalizedAt) || status !== "IN_REVIEW";

  const updateClassification = async (requestTypeId) => {
    if (classificationLoading || !requestTypeId) return;
    setClassificationLoading(true);
    setTransitionError(null);
    try {
      const updated = await updateTicketClassification(ticket.id, Number(requestTypeId));
      setFields((current) => ({
        ...current,
        responsibleAreaId: updated.responsibleAreaId,
        priority: updated.currentPriority,
        affectedCount: updated.estimatedAffectedCount ?? 0,
      }));
      reload();
    } catch (err) {
      setTransitionError(classificationErrorMessage(err));
    } finally {
      setClassificationLoading(false);
    }
  };

  const startWork = async () => {
    if (startWorkLoading) return;
    setStartWorkLoading(true);
    setTransitionError(null);
    try {
      const updated = await startTicketWork(ticket.id, fields.responsibleAreaId);
      setStatus(updated.currentStatus);
      reload();
    } catch (err) {
      setTransitionError(err?.message || "No pudimos iniciar el trabajo sobre este ticket.");
    } finally {
      setStartWorkLoading(false);
    }
  };

  const requestTransition = (nextStatus) => {
    if (status === "REGISTERED" && nextStatus === "IN_REVIEW") {
      startReview();
      return false;
    }
    if (status === "IN_REVIEW" && nextStatus === "ROUTED") {
      setDerivationOpen(true);
      return false;
    }
    if (status === "ROUTED" && nextStatus === "IN_PROGRESS") {
      startWork();
      return false;
    }
    if (nextStatus === "RESOLVED") {
      resetResolve();
      setResolveOpen(true);
      return false;
    }
    if (nextStatus === "PENDING_INFORMATION") {
      resetInfoRequest();
      setInfoRequestOpen(true);
      return false;
    }
    if ((status === "ROUTED" || status === "IN_PROGRESS") && nextStatus === "IN_REVIEW") {
      setReasonError(null);
      setReasonDialog({ kind: "return" });
      return false;
    }
    if ((status === "ROUTED" || status === "IN_PROGRESS") && nextStatus === "CANCELLED") {
      setReasonError(null);
      setReasonDialog({ kind: "reject" });
      return false;
    }
    if (status === "REGISTERED" && nextStatus === "DUPLICATE") {
      setDuplicateError(null);
      setDuplicateDialogOpen(true);
      return false;
    }
    if (["REGISTERED", "IN_REVIEW", "PENDING_INFORMATION"].includes(status) && nextStatus === "CANCELLED") {
      setReasonError(null);
      setReasonDialog({ kind: "cancel" });
      return false;
    }
    setTransitionError("Esta acción todavía no tiene un endpoint en el back — no se aplicó ningún cambio.");
    return false;
  };

  const handleReasonConfirm = async ({ reasonCode, publicMessage, internalMessage }) => {
    if (reasonLoading || !reasonDialog) return;
    setReasonLoading(true);
    setReasonError(null);
    try {
      const updated =
        reasonDialog.kind === "cancel"
          ? await cancelTicket(ticket.id, { reasonCode, publicMessage, internalMessage })
          : await (reasonDialog.kind === "return" ? returnTicketToAgent : rejectTicket)(
              ticket.id,
              fields.responsibleAreaId,
              { reasonCode, publicMessage, internalMessage }
            );
      setStatus(updated.currentStatus);
      reload();
      setReasonDialog(null);
    } catch (err) {
      setReasonError(reasonConfirmErrorMessage(err));
    } finally {
      setReasonLoading(false);
    }
  };

  const handleDuplicateConfirm = async ({ mainTicketId }) => {
    if (duplicateLoading || status !== "REGISTERED") return;
    setDuplicateLoading(true);
    setDuplicateError(null);
    try {
      const updated = await linkTicketDuplicate(ticket.id, { mainTicketId });
      setStatus(updated.currentStatus ?? "DUPLICATE");
      reload();
      setDuplicateDialogOpen(false);
    } catch (err) {
      setDuplicateError(duplicateLinkErrorMessage(err));
    } finally {
      setDuplicateLoading(false);
    }
  };

  const areaIsM2 = fields?.responsibleAreaId === "M2";
  const resolveMode =
    areaIsM2 && status === "IN_PROGRESS"
      ? "manual"
      : !areaIsM2 && (status === "ROUTED" || status === "IN_PROGRESS")
        ? "simulator"
        : null;
  const resolveIncompatibleReason = areaIsM2
    ? "El ticket debe estar En gestión para registrar su resolución."
    : `El ticket lo gestiona ${RESPONSIBLE_AREAS[fields?.responsibleAreaId] || fields?.responsibleAreaId}. Su resolución se registra desde Derivado o En gestión, con la respuesta del área.`;

  const handleResolveConfirm = async ({ type, publicMessage, internalMessage }) => {
    let when = new Date().toISOString();
    if (resolveMode === "manual") {
      const result = await resolve(ticket.id, { type, publicMessage, internalMessage });
      if (!result) return;
      when = result.resolvedAt || when;
      reload();
    } else if (resolveMode === "simulator") {
      const result = await resolveSimulated(ticket.id, {
        moduleId: fields.responsibleAreaId,
        type,
        publicMessage,
        internalMessage,
      });
      if (!result) return;
      when = result.statusChangedAt || when;
      reload();
    }
    setStatus("RESOLVED");
    setLocalMessages((items) => [
      ...items,
      { id: `resolution-msg-${Date.now()}`, text: publicMessage, visibility: "PUBLIC", createdAt: when, authorType: "AGENT" },
    ]);
    setResolveOpen(false);
  };

  const confirmDerivation = async ({ comment: derivationComment, visibility: derivationVisibility }) => {
    if (derivationLoading) return;
    setDerivationLoading(true);
    setTransitionError(null);
    try {
      const updated = await routeTicket(ticket.id);
      setStatus(updated.currentStatus);
      if (derivationComment) {
        setLocalMessages((items) => [...items, { id: `route-${Date.now()}`, text: derivationComment, visibility: derivationVisibility, createdAt: new Date().toISOString(), authorType: "AGENT" }]);
      }
      reload();
      setDerivationOpen(false);
    } catch (err) {
      setTransitionError(err?.message || "No pudimos derivar este ticket.");
    } finally {
      setDerivationLoading(false);
    }
  };

  const handleInformationRequestConfirm = async ({ messageForCitizen, internalMessage }) => {
    const result = await requestInformation(ticket.id, { messageForCitizen, internalMessage });
    if (!result) return;
    setStatus("PENDING_INFORMATION");
    reload();
    setInfoRequestOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0F2C59]" />
      </div>
    );
  }

  if (!ticket || !fields) {
    const forbidden = error?.status === 403;
    return (
      <main className="flex h-full min-h-[70vh] items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#0F2C59]">
            <FileQuestion className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-semibold text-[#D63031]">{forbidden ? "Error 403" : "Error 404"}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {forbidden ? "No tenés acceso a este ticket" : "Ticket no encontrado"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {forbidden
              ? "Este ticket pertenece a un área a la que no tenés acceso."
              : <>No existe un ticket con el identificador <strong className="text-slate-700">{ticketId}</strong>. Verificá el enlace o volvé a la bandeja de entrada.</>}
          </p>
          <Link to="/agente/tickets" className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#0F2C59] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173d73]">
            <ArrowLeft className="h-4 w-4" /> Volver a tickets
          </Link>
        </div>
      </main>
    );
  }

  const typeConfig = TICKET_TYPE_CONFIG[ticket.ticketType];
  const TypeIcon = typeConfig?.icon;

  return (
    <div className="h-full overflow-y-auto bg-white text-slate-800">
      <div className="border-b border-slate-200 px-5 py-3 md:px-7">
        <Link to="/agente/tickets" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0F2C59]"><ArrowLeft className="h-3.5 w-3.5" /> Volver a tickets</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#0F2C59]">
              {TypeIcon && (
                <span className="group relative inline-flex" title={typeConfig.label} tabIndex={0}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${typeConfig.className}`}>
                    <TypeIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                    {typeConfig.label}
                  </span>
                </span>
              )}
              <span>{ticket.publicId}</span>
              <DuplicateLinkIndicator linkInfo={duplicateLinkInfo} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">{ticket.summary}</h1>
          </div>
        	<div className="flex items-center gap-2">
        		{reviewLoading && <Loader2 className="h-4 w-4 animate-spin text-[#0F2C59]" />}
        		<Link
        			to={`/agente/tickets/${ticketId}/vista-ciudadano`}
        			className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        		>
        			<Eye className="h-3.5 w-3.5" />
        			Ver como ciudadano
        		</Link>
        		<StatusTransitionMenu status={status} onChange={setStatus} onTransitionRequest={requestTransition} />
        	</div>
        </div>
        {transitionError && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {transitionError}
          </div>
        )}
      </div>

      <div className="grid min-h-[calc(100%-102px)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="px-5 py-6 md:px-7 xl:border-r xl:border-slate-200">
          <div className="mx-auto max-w-4xl">
            <section className="border-b border-slate-200 pb-6">
              <h2 className="mb-3 text-sm font-semibold">Descripción</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                {ticket.description || "Descripción no disponible desde este endpoint."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5" />{data.neighborhood || "Ubicación pendiente"}</span>
                <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"><Users className="h-3.5 w-3.5" />{fields.affectedCount} {Number(fields.affectedCount) === 1 ? "persona afectada" : "personas afectadas"}</span>
              </div>
            </section>

            <section className="pt-6">
              <div className="flex items-end justify-between border-b border-slate-200">
                <div className="flex gap-5">{[["activity", "Actividad"], ["history", "Historial"]].map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`pb-2 text-sm font-medium ${tab === id ? "border-b-2 border-[#0F2C59] text-[#0F2C59]" : "text-slate-500"}`}>{label}</button>)}</div>
                <span className="pb-2 text-xs text-slate-500">{data.messages.length + localMessages.length} comentarios</span>
              </div>

              {tab === "activity" ? <>
                <div className="mt-4 flex gap-3"><UserAvatar user={{ initials: "CG" }} /><div className="flex-1 overflow-hidden rounded-md border border-slate-200">
                  <div className="flex bg-slate-50 text-xs"><button onClick={() => setVisibility("PUBLIC")} className={`px-4 py-2 font-medium ${visibility === "PUBLIC" ? "bg-white text-[#0F2C59]" : "text-slate-500"}`}>Responder al ciudadano</button><button onClick={() => setVisibility("INTERNAL")} className={`px-4 py-2 font-medium ${visibility === "INTERNAL" ? "bg-white text-[#0F2C59]" : "text-slate-500"}`}>Nota interna</button></div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={visibility === "PUBLIC" ? "Escribe un comentario o respuesta..." : "Agrega una nota para el equipo..."} className="h-24 w-full resize-none border-y border-slate-200 p-3 text-sm outline-none placeholder:text-slate-400" />
                  <div className="flex items-center justify-between px-3 py-2"><div className="flex gap-3 text-slate-500"><Paperclip className="h-4 w-4" /><Smile className="h-4 w-4" /></div><button onClick={submit} disabled={!comment.trim()} className="inline-flex items-center gap-2 rounded bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send className="h-3.5 w-3.5" />Enviar</button></div>
                </div></div>
                <div className="mt-7 space-y-6">{[...data.messages, ...localMessages].map((message) => { const author = message.authorType === "AGENT" ? data.assignee : data.citizen; return <article key={message.id} className="flex gap-3"><UserAvatar user={author} /><div><div className="flex flex-wrap items-center gap-2"><strong className="text-xs">{author?.name || "Equipo municipal"}</strong><span className="text-[11px] text-slate-400">{formatDate(message.createdAt)}</span>{message.visibility === "INTERNAL" && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">NOTA INTERNA</span>}</div><p className="mt-1 text-sm leading-5 text-slate-600">{message.text}</p></div></article>; })}
                  {!data.messages.length && !localMessages.length && <p className="py-6 text-center text-sm text-slate-400">Todavía no hay comentarios en este ticket.</p>}
                </div>
              </> : <div className="mt-5 space-y-4">{data.activities.map((activity) => <div key={activity.id} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 rounded-full bg-[#0F2C59]"/><div><p className="text-slate-700">{activity.message}</p><p className="mt-1 text-xs text-slate-400">{formatDate(activity.occurredAt)}</p></div></div>)}</div>}
            </section>
          </div>
        </main>

        <aside className="space-y-4 bg-slate-50/60 px-3 py-6">
          <DetailCard title="SLA" icon={Clock3}>
            <div className="space-y-3">
              <div className={`rounded-md border px-3 py-3 ${firstResponseOverdue ? "border-red-200 bg-red-50 text-red-700" : ticket?.firstResponseNearDue === true ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {firstResponseOverdue ? <TriangleAlert className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  {firstResponseOverdue ? "Primera respuesta vencida" : ticket?.firstResponseNearDue === true ? "Primera respuesta próxima a vencer" : "Primera respuesta"}
                </div>
                {firstResponseCountdown ? (
                  <p className="mt-2 text-2xl font-bold leading-tight tracking-tight" aria-label={`${firstResponseOverdue ? "Vencido hace" : "Tiempo restante"} ${firstResponseCountdown.label} para la primera respuesta`}>
                    {firstResponseOverdue ? "Vencido hace " : ""}{firstResponseCountdown.label}
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-semibold">Sin fecha de vencimiento disponible</p>
                )}
                {firstResponseDueAt && <p className="mt-1 text-[11px]">Vencimiento de primera respuesta: {formatDate(firstResponseDueAt)}</p>}
              </div>
              {slaCompleted ? (
                <div className={`rounded-md border px-3 py-3 ${slaCompletionWasCancellation ? "border-slate-300 bg-slate-100 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {slaCompletionWasCancellation ? <TriangleAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {slaCompletionWasCancellation ? "SLA finalizado por cancelación" : "SLA de resolución completado"}
                  </div>
                  <p className="mt-2 text-sm font-semibold">El ticket ya no tiene un SLA activo.</p>
                  {slaCompletionAt && <p className="mt-1 text-[11px]">Finalizado: {formatDate(slaCompletionAt)}</p>}
                  {slaDueAt && <p className="mt-1 text-[11px]">Vencimiento original: {formatDate(slaDueAt)}</p>}
                </div>
              ) : (
                <div className={`rounded-md border px-3 py-3 ${slaCountdown?.overdue || slaIndicator.status === "overdue" ? "border-red-200 bg-red-50 text-red-700" : slaIndicator.status === "at-risk" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {slaCountdown?.overdue || slaIndicator.status === "overdue" ? <TriangleAlert className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    {slaCountdown?.overdue ? "SLA vencido" : slaIndicator.label}
                  </div>
                  {slaCountdown ? (
                    <p className="mt-2 text-2xl font-bold leading-tight tracking-tight" aria-label={`${slaCountdown.overdue ? "Vencido hace" : "Tiempo restante"} ${slaCountdown.label}`}>
                      {slaCountdown.overdue ? "Vencido hace " : ""}{slaCountdown.label}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-semibold">Sin fecha de vencimiento disponible</p>
                  )}
                  {slaDueAt && <p className="mt-1 text-[11px]">Vencimiento de resolución: {formatDate(slaDueAt)}</p>}
                </div>
              )}
            </div>
          </DetailCard>
          <DetailCard title="Detalles">
            <dl className="divide-y divide-slate-100">
              <Field label="Tipo de solicitud">
                <Select
                  size="xs"
                  ariaLabel="Tipo de solicitud"
                  disabled={classificationLocked || classificationLoading}
                  value={requestTypes.find((rt) => rt.code === ticket.requestTypeCode)?.id ?? ""}
                  onChange={(nextValue) => updateClassification(nextValue)}
                  options={[
                    ...(!requestTypes.some((rt) => rt.code === ticket.requestTypeCode)
                      ? [{ value: "", label: ticket.requestTypeName || "—" }]
                      : []),
                    ...requestTypes.map((rt) => ({ value: rt.id, label: rt.name })),
                  ]}
                />
                {classificationLocked && (
                  <span className="mt-1.5 block text-[10px] font-normal leading-4 text-amber-700">
                    {ticket.classificationFinalizedAt
                      ? "La clasificación quedó fijada una vez que el ticket fue derivado."
                      : status === "REGISTERED"
                        ? "Solo se puede corregir durante la revisión inicial (después de \"Empezar análisis\")."
                        : "No se puede reclasificar en este estado."}
                  </span>
                )}
              </Field>
              <Field label="Responsable">{data.assignee.name}</Field>
              <Field label="Informante"><span className="flex items-center gap-2"><UserAvatar user={data.citizen} size="sm" />{data.citizen.name}</span></Field>
              <Field label="Prioridad"><Select size="xs" ariaLabel="Prioridad" value={fields.priority} onChange={(nextValue) => setFields((current) => ({ ...current, priority: nextValue }))} options={Object.entries(PRIORITY).map(([id, label]) => ({ value: id, label }))} /></Field>
              <Field label="Área responsable"><Select size="xs" ariaLabel="Área responsable" disabled value={fields.responsibleAreaId} options={Object.entries(RESPONSIBLE_AREAS).map(([id, label]) => ({ value: id, label: `${id} · ${label}` }))} /></Field>
              <Field label="Categoría">{data.category?.name || "Sin categoría"}</Field>
              <Field label="Subcategoría">{data.subcategory?.name || "—"}</Field>
              <Field label="Afectados">
                <span>{fields.affectedCount}</span>
                <span className="mt-1 block text-[10px] font-normal leading-4 text-slate-400">Estimado automáticamente por el sistema (barrio y tipo de solicitud); no depende de tickets duplicados vinculados.</span>
              </Field>
              <Field label="Barrio">{data.neighborhood || "—"}</Field>
            </dl>
          </DetailCard>
          <DetailCard title="Adjuntos" icon={Paperclip}>
            <AttachmentGallery
              title=""
              canUpload
              fetchList={() => Promise.resolve(ticket.attachments ?? [])}
              uploadFile={(file) => uploadTicketAttachment(ticket.id, file)}
              downloadFile={(attachment) => downloadTicketAttachment(attachment.id)}
            />
          </DetailCard>
          {escalated && (
            <DetailCard title="Escalamiento" icon={TriangleAlert}>
              <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-violet-800">
                <p className="text-xs font-semibold">Ticket escalado</p>
                <dl className="mt-1 space-y-1 text-[11px]">
                  <div className="flex justify-between gap-3"><dt>Motivo</dt><dd className="font-medium text-right">{ticket.escalationReasonCode || "No informado"}</dd></div>
                  {ticket.escalatedAt && <div className="flex justify-between gap-3"><dt>Escalado</dt><dd className="font-medium text-right">{formatDate(ticket.escalatedAt)}</dd></div>}
                </dl>
              </div>
            </DetailCard>
          )}
          <div className="px-1 py-2 text-[11px] text-slate-500"><div className="flex justify-between py-1"><span>Creado</span><span>{formatDate(ticket.createdAt)}</span></div><div className="flex justify-between py-1"><span>Actualizado</span><span>{formatDate(ticket.updatedAt)}</span></div></div>
        </aside>
      </div>
      {derivationOpen && <TicketTransitionDialog
        open={derivationOpen}
        eyebrow={`Cambio de estado · ${ticket.publicId}`}
        title="Derivar ticket"
        description="El ticket pasa a Derivado, con el área ya asignada por la clasificación."
        confirmation={<>Vas a derivar este ticket a <strong>{RESPONSIBLE_AREAS[fields.responsibleAreaId] || fields.responsibleAreaId}</strong>.</>}
        confirmLabel={derivationLoading ? "Derivando…" : "Confirmar derivación"}
        onCancel={() => setDerivationOpen(false)}
        onConfirm={confirmDerivation}
      />}
      {resolveOpen && (
        <ResolveTicketDialog
          ticketPublicId={ticket.publicId}
          mode={resolveMode}
          incompatibleReason={resolveIncompatibleReason}
          loading={resolving}
          error={resolveError}
          onCancel={() => setResolveOpen(false)}
          onConfirm={handleResolveConfirm}
        />
      )}
      {infoRequestOpen && (
        <RequestInformationDialog
          ticketPublicId={ticket.publicId}
          loading={infoRequestLoading}
          error={infoRequestError}
          onCancel={() => setInfoRequestOpen(false)}
          onConfirm={handleInformationRequestConfirm}
        />
      )}
      {reasonDialog && (
        <TicketReasonDialog
          ticketPublicId={ticket.publicId}
          {...REASON_DIALOG_CONFIG[reasonDialog.kind]}
          loading={reasonLoading}
          error={reasonError}
          onCancel={() => setReasonDialog(null)}
          onConfirm={handleReasonConfirm}
        />
      )}
      {duplicateDialogOpen && (
        <DuplicateLinkDialog
          ticket={ticket}
          loading={duplicateLoading}
          error={duplicateError}
          onCancel={() => setDuplicateDialogOpen(false)}
          onConfirm={handleDuplicateConfirm}
        />
      )}
    </div>
  );
}
