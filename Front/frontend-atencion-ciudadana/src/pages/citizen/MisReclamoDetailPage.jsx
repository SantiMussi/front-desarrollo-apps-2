import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMyTicketDetail } from "../../hooks/useMyTicketDetail";
import { useTicketMessages } from "../../hooks/useTicketMessages";
import { useAuth } from "../../context/useAuth";
import CitizenTicketView from "../../components/ticket/CitizenTicketView";
import { uploadTicketAttachment, downloadTicketAttachment } from "../../services/apiClient";

export default function MisReclamoDetailPage() {
  const { publicId } = useParams();
  const { user } = useAuth();
  const { ticket, loading, error, actions, actionLoading, actionError } =
    useMyTicketDetail(publicId);
  const chatMessages = useTicketMessages(ticket?.id);

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
      attachments={{
        canUpload: true,
        uploadFile: (file) => uploadTicketAttachment(ticket.id, file),
        downloadFile: (attachment) => downloadTicketAttachment(attachment.id),
      }}
      chat={{
        items: chatMessages.messages,
        loading: chatMessages.loading,
        error: chatMessages.error,
        canSend: true,
        currentAuthorId: user?.citizenId,
        onSend: (text) => chatMessages.send("PUBLIC", text),
        onEdit: chatMessages.edit,
        onDelete: chatMessages.remove,
        messageForError: chatMessages.messageForError,
      }}
    />
  );
}
