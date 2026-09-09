import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Hammer } from "lucide-react";

/**
 * Detalle público del ticket (al que se llega desde "Consultar Ticket" tras
 * ingresar el código de seguimiento).
 *
 * TODO: implementar. Debe llamar `trackTicket(codigo)` (services/apiClient) y
 * renderizar `<PublicTicketStatus ticket={data} />` (components/ui), más el
 * manejo de 404 / 400 como "código inexistente o inválido".
 */
export default function PublicTicketDetailPage() {
  const { codigo } = useParams();

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <Hammer className="h-6 w-6" />
      </div>
      <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#D63031]">Seguimiento</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0F2C59]">
        Detalle del reclamo
      </h1>
      <p className="mt-3 text-[14px] text-neutral-500">
        Código:{" "}
        <span className="font-mono font-semibold text-neutral-700">{codigo}</span>
      </p>
      <p className="mt-5 text-[13px] text-neutral-400">
        Esta pantalla todavía no está implementada.
      </p>

      <Link
        to="/seguimiento"
        className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F2C59] hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Consultar otro código
      </Link>
    </div>
  );
}
