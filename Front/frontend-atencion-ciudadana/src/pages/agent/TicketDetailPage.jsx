import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Clock3, MapPin, Paperclip, Send, Smile, Tag, Users } from "lucide-react";
import DetailCard from "../../components/ui/DetailCard";
import UserAvatar from "../../components/ui/UserAvatar";
import {
  MOCK_CITIZENS, MOCK_REQUEST_TYPES_LIST, MOCK_SUBCATEGORIES_LIST, MOCK_CATEGORIES_LIST,
  MOCK_TICKETS, MOCK_TICKET_ACTIVITIES_LIST, MOCK_TICKET_LOCATIONS_LIST, MOCK_TICKET_MESSAGES_LIST,
  MOCK_USERS_LIST
} from "../../data/mockTickets";

const STATUS = { REGISTERED: "Registrado", IN_REVIEW: "En revisión", ROUTED: "Derivado", IN_PROGRESS: "En progreso", PENDING_INFORMATION: "Pendiente de información", RESOLVED: "Resuelto", CLOSED: "Cerrado", DUPLICATE: "Duplicado", CANCELLED: "Cancelado" };
const PRIORITY = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };
const AREA = { "AREA-LIGHTING": "Alumbrado público", "AREA-ROADWORKS": "Mantenimiento vial", "AREA-SANITATION": "Higiene urbana", "AREA-GREEN": "Espacios verdes", "AREA-TRAFFIC": "Tránsito y movilidad" };
const formatDate = (value) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function Field({ label, children }) {
  return <div className="grid grid-cols-[118px_1fr] gap-3 py-2.5 text-xs"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 font-medium text-slate-700">{children}</dd></div>;
}

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const ticket = MOCK_TICKETS.find((item) => item.id === ticketId) || MOCK_TICKETS[1];
  const [status, setStatus] = useState(ticket.currentStatus);
  const [tab, setTab] = useState("activity");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [comment, setComment] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const data = useMemo(() => {
    const request = MOCK_REQUEST_TYPES_LIST.find((item) => item.id === ticket.requestTypeId);
    const subcategory = MOCK_SUBCATEGORIES_LIST.find((item) => item.id === request?.subcategoryId);
    return {
      request, category: MOCK_CATEGORIES_LIST.find((item) => item.id === subcategory?.categoryId),
      citizen: MOCK_CITIZENS.find((item) => item.id === ticket.citizenId),
      assignee: MOCK_USERS_LIST.find((item) => item.id === ticket.assignedAgentId),
      location: MOCK_TICKET_LOCATIONS_LIST.find((item) => item.ticketId === ticket.id),
      messages: MOCK_TICKET_MESSAGES_LIST.filter((item) => item.ticketId === ticket.id),
      activities: MOCK_TICKET_ACTIVITIES_LIST.filter((item) => item.ticketId === ticket.id)
    };
  }, [ticket]);
  const submit = () => {
    if (!comment.trim()) return;
    setLocalMessages((items) => [...items, { id: `local-${Date.now()}`, text: comment, visibility, createdAt: new Date().toISOString(), authorType: "AGENT" }]);
    setComment("");
  };

  return (
    <div className="h-full overflow-y-auto bg-white text-slate-800">
      <div className="border-b border-slate-200 px-5 py-3 md:px-7">
        <Link to="/agente/tickets" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0F2C59]"><ArrowLeft className="h-3.5 w-3.5" /> Volver a tickets</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div><div className="mb-1 text-xs font-semibold text-[#0F2C59]">{ticket.publicId}</div><h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">{ticket.summary}</h1></div>
          <div className="relative">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="appearance-none rounded-md border-0 bg-amber-100 py-2 pl-3 pr-9 text-xs font-bold uppercase text-amber-800 outline-none ring-1 ring-amber-200">
              {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select><ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-amber-700" />
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100%-102px)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="px-5 py-6 md:px-7 xl:border-r xl:border-slate-200">
          <div className="mx-auto max-w-4xl">
            <section className="border-b border-slate-200 pb-6">
              <h2 className="mb-3 text-sm font-semibold">Descripción</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">{ticket.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5" />{data.location?.addressLine || "Ubicación pendiente"}</span>
                <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"><Users className="h-3.5 w-3.5" />{ticket.affectedCount} {ticket.affectedCount === 1 ? "persona afectada" : "personas afectadas"}</span>
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
                <div className="mt-7 space-y-6">{[...data.messages, ...localMessages].map((message) => { const author = message.authorType === "AGENT" ? (data.assignee || { name: "Carlos Gómez", initials: "CG" }) : data.citizen; return <article key={message.id} className="flex gap-3"><UserAvatar user={author} /><div><div className="flex flex-wrap items-center gap-2"><strong className="text-xs">{author?.name || "Equipo municipal"}</strong><span className="text-[11px] text-slate-400">{formatDate(message.createdAt)}</span>{message.visibility === "INTERNAL" && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">NOTA INTERNA</span>}</div><p className="mt-1 text-sm leading-5 text-slate-600">{message.text}</p></div></article>; })}
                  {!data.messages.length && !localMessages.length && <p className="py-6 text-center text-sm text-slate-400">Todavía no hay comentarios en este ticket.</p>}
                </div>
              </> : <div className="mt-5 space-y-4">{data.activities.map((activity) => <div key={activity.id} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 rounded-full bg-[#0F2C59]"/><div><p className="text-slate-700">{activity.message}</p><p className="mt-1 text-xs text-slate-400">{formatDate(activity.occurredAt)}</p></div></div>)}</div>}
            </section>
          </div>
        </main>

        <aside className="bg-slate-50/60 px-5 py-6 space-y-4">
          <DetailCard title="Detalles">
            <dl className="divide-y divide-slate-100">
              <Field label="Tipo de solicitud">{data.request?.name || ticket.ticketType}</Field>
              <Field label="Responsable"><span className="flex items-center gap-2"><UserAvatar user={data.assignee} size="sm" />{data.assignee?.name || "Sin asignar"}</span></Field>
              <Field label="Informante"><span className="flex items-center gap-2"><UserAvatar user={data.citizen || { initials: "AN" }} size="sm" />{ticket.anonymous ? "Anónimo" : data.citizen?.name}</span></Field>
              <Field label="Prioridad"><span className={ticket.currentPriorityFactor === "CRITICAL" || ticket.currentPriorityFactor === "HIGH" ? "text-red-600" : ""}>{PRIORITY[ticket.currentPriorityFactor]}</span></Field>
              <Field label="Área responsable">{AREA[ticket.responsibleAreaId]}</Field>
              <Field label="Categoría">{data.category?.name || "Sin categoría"}</Field>
              <Field label="Canal">{ticket.preferredNotificationChannel || "Sin preferencia"}</Field>
              <Field label="Etiquetas"><span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1"><Tag className="h-3 w-3" />{data.request?.code?.toLowerCase()}</span></Field>
            </dl>
          </DetailCard>
          <DetailCard title="SLA" icon={Clock3}>
            <div className="flex items-center justify-between text-xs"><span className="font-medium">Tiempo de resolución</span><strong className="text-red-600">32h 15m</strong></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[67%] rounded-full bg-[#D63031]" /></div>
            <p className="mt-2 text-[11px] text-slate-400">Vence mañana a las 18:00 hs</p>
          </DetailCard>
          <div className="px-1 py-2 text-[11px] text-slate-500"><div className="flex justify-between py-1"><span>Creado</span><span>{formatDate(ticket.createdAt)}</span></div><div className="flex justify-between py-1"><span>Actualizado</span><span>{formatDate(ticket.updatedAt)}</span></div></div>
        </aside>
      </div>
    </div>
  );
}