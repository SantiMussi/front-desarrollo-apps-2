import { useEffect, useState } from "react";
import { fetchStaffCapabilities } from "../services/apiClient";

/**
 * Qué permite este servidor al personal (GET /staff/capabilities).
 * `simulatorEnabled` es true o false cuando el back lo informó, y null mientras carga o si no pudo
 * responder: en ese caso la pantalla conserva su comportamiento anterior en vez de ocultar acciones
 * que quizá sí funcionan.
 */
export function useStaffCapabilities() {
  const [simulatorEnabled, setSimulatorEnabled] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchStaffCapabilities();
        if (!cancelled && typeof data?.simulatorEnabled === "boolean") setSimulatorEnabled(data.simulatorEnabled);
      } catch {
        // Sin dato del servidor la pantalla no cambia.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { simulatorEnabled };
}
