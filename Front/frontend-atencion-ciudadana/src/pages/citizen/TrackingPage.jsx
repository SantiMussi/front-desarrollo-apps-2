import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";

/**
 * Pantalla pública para ingresar un código de seguimiento.
 * Al enviar, navega al detalle del ticket (`/seguimiento/:codigo`), que es
 * quien hace la consulta real y muestra el estado o el error.
 */
export default function TrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("codigo") ?? "");
  const [touched, setTouched] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setTouched(true);
      return;
    }
    navigate(`/seguimiento/${encodeURIComponent(value)}`);
  };

  return (
    <>
      <PageHeader
        label="Seguimiento"
        title="Consultá tu"
        highlight="solicitud"
        description="Ingresá el código de seguimiento que recibiste al generar tu reclamo para ver en qué estado está."
      />

      <div className="mx-auto max-w-2xl px-5 py-10">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setTouched(false);
              }}
              placeholder="Ej.: a1B2c3D4e5F6..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-3 text-[14px] font-mono tracking-wide outline-none transition-colors focus:border-[#D63031]/40 focus:ring-2 focus:ring-[#D63031]/10"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D63031] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#c0282a]"
          >
            Consultar
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {touched && !code.trim() && (
          <p className="mt-2 text-[13px] text-red-600">Ingresá un código de seguimiento.</p>
        )}

        <p className="mt-6 text-center text-[13px] text-neutral-400">
          La consulta es pública y de solo lectura: muestra el estado de la solicitud, sin datos internos.
        </p>
      </div>
    </>
  );
}
