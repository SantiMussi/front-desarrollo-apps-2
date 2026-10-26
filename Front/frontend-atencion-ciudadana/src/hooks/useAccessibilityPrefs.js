import { useCallback, useState } from "react";

const STORAGE_KEY = "ciudad-uade:a11y";

export const TEXT_ZOOM = [1, 1.15, 1.3];

function readStored() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    const size = Number.isInteger(parsed.size) && parsed.size >= 0 && parsed.size < TEXT_ZOOM.length ? parsed.size : 0;
    return { size, contrast: parsed.contrast === true };
  } catch {
    return { size: 0, contrast: false };
  }
}

function persist(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Sin almacenamiento disponible: la preferencia vale sólo para esta visita.
  }
}

// Sólo guarda preferencias de visualización; nunca datos personales ni del reclamo.
export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState(readStored);

  const update = useCallback((change) => {
    setPrefs((current) => {
      const next = { ...current, ...change };
      persist(next);
      return next;
    });
  }, []);

  const setSize = useCallback((size) => update({ size }), [update]);
  const toggleContrast = useCallback(
    () => setPrefs((current) => {
      const next = { ...current, contrast: !current.contrast };
      persist(next);
      return next;
    }),
    [],
  );

  return { ...prefs, zoom: TEXT_ZOOM[prefs.size], setSize, toggleContrast };
}
