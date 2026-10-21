import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { exportIndicatorTickets } from "../../services/apiClient";

export default function TicketMetricsExportButton({ filters, disabled }) {
  const active = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await exportIndicatorTickets(filters);
      if (!active.current) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `metricas-${filters.days}-dias.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      if (active.current) setError(err?.status === 401 ? "Tu sesión no es válida. Volvé a iniciar sesión."
        : err?.status === 403 ? "No tenés permiso para exportar estos tickets." : err?.message || "No pudimos exportar los tickets.");
    } finally {
      if (active.current) setBusy(false);
    }
  };
  return <>
    <button onClick={download} disabled={disabled || busy} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#163d75] disabled:opacity-50"><Download className="h-4 w-4" />{busy ? "Exportando…" : "Exportar"}</button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </>;
}
