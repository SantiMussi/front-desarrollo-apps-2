import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMyTicketDetail } from "../../hooks/useMyTicketDetail";
import CitizenTicketView from "../../components/ticket/CitizenTicketView";

export default function MisReclamoDetailPage() {
  const { publicId } = useParams();
  const { ticket, loading, error, actions, actionLoading, actionError } =
    useMyTicketDetail(publicId);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="text-[14px] text-neutral-500">
          {error || "No encontramos este reclamo."}
        </p>
        <Link
          to="/mis-reclamos"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F2C59] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Mis Reclamos
        </Link>
      </div>
    );
  }

  return (
    <CitizenTicketView
      ticket={ticket}
      backTo="/mis-reclamos"
      backLabel="Mis Reclamos"
      actions={actions}
      actionLoading={actionLoading}
      actionError={actionError}
    />
  );
}
