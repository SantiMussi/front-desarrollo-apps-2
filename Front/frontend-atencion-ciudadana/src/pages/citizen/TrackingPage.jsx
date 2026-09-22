import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2, AlertCircle, RotateCcw, KeyRound, Unlock } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import PublicTicketStatus from "../../components/ui/PublicTicketStatus";
import CitizenTicketView from "../../components/ticket/CitizenTicketView";
import { trackTicket } from "../../services/apiClient";
import { useAnonymousTicketAccess } from "../../hooks/useAnonymousTicketAccess";

function AccreditationPanel({ onAccredit, accrediting, accreditError }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    onAccredit(password.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/60 px-5 py-4">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-700">
        <KeyRound className="h-4 w-4 text-neutral-400" />
        ¿Sos el dueño de este ticket?
      </p>
      <p className="mt-0.5 text-[12px] text-neutral-500">
        Ingresá la contraseña del ticket para responder, confirmar la resolución, reabrirlo o calificarlo.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña del ticket"
          autoComplete="off"
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-[#D63031]/40 focus:ring-2 focus:ring-[#D63031]/10"
        />
        <button
          type="submit"
          disabled={accrediting || !password.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F2C59] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1a3f7a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {accrediting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
          Acreditar
        </button>
      </div>
      {accreditError && <p className="mt-2 text-[12px] text-red-600">{accreditError}</p>}
    </form>
  );
}

export default function TrackingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(() => location.state?.codigo ?? "");
  const [status, setStatus] = useState("idle");
  const [ticket, setTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [trackedCode, setTrackedCode] = useState("");
  const autoRan = useRef(false);
  const anon = useAnonymousTicketAccess(trackedCode);

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
      setTicket(data);
      setTrackedCode(value);
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
      anon.reset();
      lookup(fromState);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, lookup, navigate, anon]);

  const handleSubmit = (e) => {
    e.preventDefault();
    anon.reset();
    lookup(code);
  };

  const resetSearch = () => {
    setCode("");
    setTicket(null);
    setStatus("idle");
    setErrorMessage("");
    setTrackedCode("");
    anon.reset();
  };

  if (status === "success" && ticket && anon.accredited && anon.ticket) {
    return (
      <>
        <div className="border-b border-neutral-100 bg-neutral-50/60 px-5 py-3 text-center">
          <button
            type="button"
            onClick={resetSearch}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F2C59] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Consultar otro código
          </button>
        </div>
        <CitizenTicketView
          ticket={anon.ticket}
          actions={anon.actions}
          actionLoading={anon.actionLoading}
          actionError={anon.actionError}
          attachments={anon.attachments}
          chat={{
            items: anon.ticket.messages,
            loading: false,
            error: null,
            canSend: true,
            onSend: anon.sendMessage,
            messageForError: anon.messageForError,
          }}
        />
      </>
    );
  }

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

            <AccreditationPanel
              onAccredit={anon.accredit}
              accrediting={anon.accrediting}
              accreditError={anon.accreditError}
            />

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
