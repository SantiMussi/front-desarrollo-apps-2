import { CheckCircle2, Clock, FileText, Ban } from "lucide-react";
import { TICKET_STATUS_LABELS } from "../../constants/ticketStatuses";

const STEPS = ["Registrado", "En gestión", "Resuelto"];
const STEP_BY_STATUS = {
  REGISTERED: 0,
  IN_REVIEW: 0,
  ROUTED: 0,
  IN_PROGRESS: 1,
  PENDING_INFORMATION: 1,
  RESOLVED: 2,
  CLOSED: 2,
};

const NON_PROGRESS_MESSAGES = {
  CANCELLED: "Esta solicitud fue cancelada.",
  DUPLICATE: "Esta solicitud fue identificada como duplicada de otro reclamo ya registrado.",
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(value)
      )
    : "—";

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";

function StatusStepper({ status }) {
  const nonProgressMessage = NON_PROGRESS_MESSAGES[status];

  if (nonProgressMessage) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
        <Ban className="h-5 w-5 shrink-0 text-neutral-500" strokeWidth={2} />
        <p className="text-[13px] font-medium text-neutral-600">{nonProgressMessage}</p>
      </div>
    );
  }

  const currentStep = STEP_BY_STATUS[status] ?? 0;

  return (
    <div className="flex items-center">
      {STEPS.map((label, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-colors ${
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : active
                      ? "border-[#0F2C59] bg-[#0F2C59] text-white"
                      : "border-neutral-200 bg-white text-neutral-300"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-[#0F2C59]" : done ? "text-emerald-600" : "text-neutral-400"
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded ${
                  index < currentStep ? "bg-emerald-500" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-neutral-100 py-2.5 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="text-[13px] text-neutral-700 sm:text-right">{value || "—"}</span>
    </div>
  );
}

export default function PublicTicketStatus({ ticket }) {
  if (!ticket) return null;
  const currentStatus = ticket.status ?? ticket.currentStatus;
  const openTicket = !["RESOLVED", "CLOSED", "CANCELLED", "DUPLICATE"].includes(currentStatus);
  const resolutionDueAt = ticket.sla?.resolutionDueAt ?? ticket.resolutionDueAt;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2C59]/5 text-[#0F2C59]">
              <FileText className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                N° de caso
              </p>
              <p className="font-mono text-[15px] font-bold text-[#0F2C59]">{ticket.publicId}</p>
            </div>
          </div>
          <span className="rounded-md bg-[#0F2C59]/5 px-2.5 py-1 text-[12px] font-semibold text-[#0F2C59]">
            {TICKET_STATUS_LABELS[currentStatus] ?? currentStatus}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-[15px] font-semibold text-neutral-800">{ticket.summary}</p>

        <div className="mt-6">
          <StatusStepper status={currentStatus} />
        </div>

        <div className="mt-6">
          <InfoRow label="Tipo de solicitud" value={ticket.requestType?.name} />
          <InfoRow label="Categoría" value={ticket.category?.name} />
          <InfoRow label="Subcategoría" value={ticket.subcategory?.name} />
          <InfoRow label="Fecha de ingreso" value={formatDate(ticket.createdAt)} />
          <InfoRow label="Última actualización" value={formatDateTime(ticket.statusChangedAt)} />
          {openTicket && resolutionDueAt && (
            <InfoRow
              label="Resolución estimada"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  {formatDate(resolutionDueAt)}
                </span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
