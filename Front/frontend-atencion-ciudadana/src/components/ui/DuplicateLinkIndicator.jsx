import { Copy, Link2 } from "lucide-react";

export default function DuplicateLinkIndicator({ linkInfo }) {
  if (!linkInfo || (!linkInfo.isDuplicate && !linkInfo.duplicateTicketsCount)) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {linkInfo.isDuplicate && (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600"
          title={linkInfo.mainTicketPublicId ? `Vinculado como duplicado de ${linkInfo.mainTicketPublicId}` : "Vinculado a un ticket principal"}
        >
          <Link2 className="h-3 w-3" aria-hidden="true" />
          {linkInfo.mainTicketPublicId ? `Duplicado de ${linkInfo.mainTicketPublicId}` : "Duplicado"}
        </span>
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
