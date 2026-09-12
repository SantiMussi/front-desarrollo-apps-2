import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTicketCitizenView } from "../../hooks/useTicketCitizenView";
import { normalizeTicketDetail } from "../../hooks/useMyTicketDetail";
import CitizenTicketView from "../../components/ticket/CitizenTicketView";

export default function TicketCitizenViewPage() {
  const { ticketId } = useParams();
  const { view, loading, error } = useTicketCitizenView(ticketId);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="text-[14px] text-neutral-500">{error || "No encontramos este ticket."}</p>
        <Link
          to={`/agente/tickets/${ticketId}`}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F2C59] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al ticket
        </Link>
      </div>
    );
  }

  const ticket = normalizeTicketDetail(view, view.publicId);

  return (
    <CitizenTicketView
      ticket={ticket}
      readOnly
      backTo={`/agente/tickets/${ticketId}`}
      backLabel="Volver al ticket"
    />
  );
}
