import { Link } from "react-router-dom";
import { Copy, Link2 } from "lucide-react";

export default function DuplicateLinkIndicator({ linkInfo }) {
  if (!linkInfo || (!linkInfo.isDuplicate && !linkInfo.duplicateTicketsCount)) return null;

  const badgeClassName =
    "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {linkInfo.isDuplicate && (
        linkInfo.mainTicketId ? (
          <Link
            to={`/agente/tickets/${linkInfo.mainTicketId}`}
            onClick={(event) => event.stopPropagation()}
            className={`${badgeClassName} hover:border-[#0F2C59] hover:text-[#0F2C59]`}
            title={linkInfo.mainTicketPublicId ? `Ir al ticket principal ${linkInfo.mainTicketPublicId}` : "Ir al ticket principal"}
          >
            <Link2 className="h-3 w-3" aria-hidden="true" />
            {linkInfo.mainTicketPublicId ? `Duplicado de ${linkInfo.mainTicketPublicId}` : "Duplicado"}
          </Link>
        ) : (
          <span className={badgeClassName} title="Vinculado a un ticket principal">
            <Link2 className="h-3 w-3" aria-hidden="true" />
            Duplicado
          </span>
        )
      )}
      {linkInfo.duplicateTicketsCount > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600"
          title={`${linkInfo.duplicateTicketsCount} ticket(s) vinculado(s) como duplicado de este`}
        >
          <Copy className="h-3 w-3" aria-hidden="true" />
          {linkInfo.duplicateTicketsCount} duplicado{linkInfo.duplicateTicketsCount === 1 ? "" : "s"}
        </span>
      )}
    </span>
  );
}
