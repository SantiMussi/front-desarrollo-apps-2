import { useEffect, useId, useRef, useState } from "react";
import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { fetchOwnTrackingCode } from "../../services/apiClient";
import { getCurrentSessionKey, useSessionToken } from "../../hooks/useSessionToken";

function errorMessage(status) {
  if (status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (status === 404 || status === 403) return "No tenés acceso al código de este reclamo.";
  if (status === 409) return "Este reclamo no tiene un código recuperable. Si es anterior a esta función, necesitás el código que recibiste al crearlo.";
  if (status === 503) return "El código no está disponible por el momento. Intentá más tarde.";
  if (status === 400) return "No pudimos identificar este reclamo. Volvé a abrir el detalle.";
  return "No pudimos recuperar el código. Intentá de nuevo.";
}

// A new ticket or login unmounts sensitive state; renewal retains the session.
export default function OwnTrackingCode({ ticketId }) {
  const { user } = useAuth();
  const token = useSessionToken();
  if (!ticketId || !user || !token || user.role !== "CITIZEN") return null;
  return <TrackingCode key={JSON.stringify([ticketId, user.id, user.actorId ?? user.citizenId, token])} ticketId={ticketId} token={token} />;
}

function TrackingCode({ ticketId, token }) {
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const pending = useRef(null);
  const generation = useRef(0);
  const copyInFlight = useRef(false);
  const codeId = useId();

  useEffect(() => () => {
    generation.current += 1;
    pending.current?.abort();
  }, []);

  function hide() {
    generation.current += 1;
    pending.current?.abort();
    pending.current = null;
    copyInFlight.current = false;
    setCode(null);
    setLoading(false);
    setError(null);
    setCopyStatus("");
    setCopying(false);
  }

  async function show() {
    if (pending.current || getCurrentSessionKey() !== token) return;
    const controller = new AbortController();
    pending.current = controller;
    const current = ++generation.current;
    const active = () => current === generation.current && !controller.signal.aborted && getCurrentSessionKey() === token;
    setLoading(true);
    setError(null);
    setCopyStatus("");
    try {
      const response = await fetchOwnTrackingCode(ticketId, { signal: controller.signal });
      if (!active()) return;
      if (typeof response?.trackingCode !== "string" || !response.trackingCode.trim()) {
        setError("No pudimos recuperar el código. Intentá de nuevo.");
        return;
      }
      setCode(response.trackingCode);
    } catch (err) {
      if (active()) setError(errorMessage(err?.status));
    } finally {
      if (active()) {
        pending.current = null;
        setLoading(false);
      }
    }
  }

  async function copy() {
    if (!code || copyInFlight.current || getCurrentSessionKey() !== token) return;
    const current = generation.current;
    copyInFlight.current = true;
    setCopying(true);
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText(code);
      if (current === generation.current && getCurrentSessionKey() === token) setCopyStatus("Código copiado.");
    } catch {
      if (current === generation.current && getCurrentSessionKey() === token) setCopyStatus("No pudimos copiar el código. Podés seleccionarlo y copiarlo manualmente.");
    } finally {
      if (current === generation.current && getCurrentSessionKey() === token) {
        copyInFlight.current = false;
        setCopying(false);
      }
    }
  }

  const buttonClass = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2C59] disabled:opacity-60";
  return (
    <section aria-label="Código de seguimiento" className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={code || loading ? hide : show} aria-expanded={Boolean(code || loading)} aria-controls={codeId} className={buttonClass}>
          {loading ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : code ? <EyeOff aria-hidden="true" className="h-3.5 w-3.5" /> : <Eye aria-hidden="true" className="h-3.5 w-3.5" />}
          {code || loading ? "Ocultar código" : "Mostrar código de seguimiento"}
        </button>
        {loading && <span role="status" className="text-[12px] text-neutral-500">Recuperando código…</span>}
        {code && <button type="button" onClick={copy} disabled={copying} className={buttonClass}><Copy aria-hidden="true" className="h-3.5 w-3.5" />Copiar código</button>}
      </div>
      <div id={codeId}>
        {code && <>
          <code className="mt-3 block select-all break-all rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[14px] text-[#0F2C59]">{code}</code>
          <p className="mt-2 text-[12px] text-neutral-500">Guardalo en un lugar seguro. Si lo copiás, puede permanecer en el portapapeles después de ocultarlo.</p>
        </>}
      </div>
      {error && <p role="alert" className="mt-2 text-[12px] text-red-600">{error}</p>}
      {copyStatus && <p role="status" className="mt-2 text-[12px] text-neutral-600">{copyStatus}</p>}
    </section>
  );
}
