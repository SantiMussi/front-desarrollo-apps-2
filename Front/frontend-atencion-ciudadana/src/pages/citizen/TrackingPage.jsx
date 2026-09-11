import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import PublicTicketStatus from "../../components/ui/PublicTicketStatus";
import { trackTicket } from "../../services/apiClient";

export default function TrackingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(() => location.state?.codigo ?? "");
  const [status, setStatus] = useState("idle");
  const [ticket, setTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const autoRan = useRef(false);

  const lookup = useCallback(async (rawCode) => {
    const value = rawCode.trim();
    if (!value) {
      setStatus("error");
      setErrorMessage("Ingresá un código de seguimiento.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setTicket(null);

    try {
      const data = await trackTicket(value);
      console.log("[TrackingPage] /tracking/access response:", data);
      setTicket(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      if (err?.status === 404) {
        setErrorMessage(
          "No encontramos ninguna solicitud con ese código. Revisá que esté escrito correctamente."
        );
      } else if (err?.status === 400) {
        setErrorMessage("El código ingresado no es válido.");
      } else {
        setErrorMessage(
          err?.message || "No pudimos consultar el estado. Intentá de nuevo en unos minutos."
        );
      }
    }
  }, []);

  useEffect(() => {
    const fromState = location.state?.codigo;
    if (fromState && !autoRan.current) {
      autoRan.current = true;
      lookup(fromState);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, lookup, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    lookup(code);
  };

  const resetSearch = () => {
    setCode("");
    setTicket(null);
    setStatus("idle");
    setErrorMessage("");
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej.: a1B2c3D4e5F6..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-3 text-[14px] font-mono tracking-wide outline-none transition-colors focus:border-[#D63031]/40 focus:ring-2 focus:ring-[#D63031]/10"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D63031] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#c0282a] disabled:cursor-wait disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Consultar
          </button>
        </form>

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D63031]" strokeWidth={2} />
            <p className="text-[13.5px] leading-relaxed text-red-700">{errorMessage}</p>
          </motion.div>
        )}

        {status === "success" && ticket && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <PublicTicketStatus ticket={ticket} />
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={resetSearch}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F2C59] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Consultar otro código
              </button>
            </div>
          </motion.div>
        )}

        {status === "idle" && (
          <p className="mt-6 text-center text-[13px] text-neutral-400">
            La consulta es pública y de solo lectura: muestra el estado de la solicitud, sin datos internos.
          </p>
        )}
      </div>
    </>
  );
}
