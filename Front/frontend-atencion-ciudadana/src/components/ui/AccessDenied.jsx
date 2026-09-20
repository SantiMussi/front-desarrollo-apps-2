import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const HOME_BY_ROLE = {
  AGENT: "/agente/tickets",
  ADMIN: "/agente/tickets",
  AREA_RESPONSIBLE: "/agente/tickets",
  CITIZEN: "/",
};

export default function AccessDenied({ role }) {
  const homePath = HOME_BY_ROLE[role] ?? "/";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#D63031]">
        <ShieldAlert className="h-7 w-7" strokeWidth={2} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-slate-800">Acceso denegado</h1>
        <p className="mt-1.5 max-w-sm text-[13.5px] text-slate-500">
          Tu usuario no tiene permisos suficientes para acceder a esta sección.
        </p>
      </div>
      <Link
        to={homePath}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1a3f7a]"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
