import { useEffect, useRef, useState } from "react";
import { Accessibility, Contrast, X } from "lucide-react";

const SIZE_OPTIONS = [
  { name: "Tamaño de letra normal", textClass: "text-[14px]" },
  { name: "Tamaño de letra grande", textClass: "text-[18px]" },
  { name: "Tamaño de letra muy grande", textClass: "text-[22px]" },
];

const ACTIVE = "border-[#0F2C59] bg-[#0F2C59] text-white";
const IDLE = "border-neutral-300 bg-white text-[#0F2C59] hover:bg-neutral-100";

// Botón flotante discreto: la interfaz queda igual hasta que alguien abre el panel.
export default function AccessibilityBar({ size, contrast, onSizeChange, onToggleContrast }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-40">
      {open && (
        <div
          role="group"
          aria-label="Opciones de accesibilidad"
          className="mb-2 w-60 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#0F2C59]">Ver mejor</p>
            <button type="button" aria-label="Cerrar opciones" onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-800">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-[12px] font-medium text-neutral-600">Tamaño de letra</p>
          <div role="group" aria-label="Tamaño del texto" className="mt-1.5 flex gap-2">
            {SIZE_OPTIONS.map((option, index) => (
              <button
                key={option.name}
                type="button"
                aria-label={option.name}
                aria-pressed={size === index}
                onClick={() => onSizeChange(index)}
                className={`flex h-10 flex-1 items-center justify-center rounded-lg border font-bold leading-none transition-colors ${option.textClass} ${size === index ? ACTIVE : IDLE}`}
              >
                A
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={contrast}
            onClick={onToggleContrast}
            className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-[13px] font-semibold transition-colors ${contrast ? ACTIVE : IDLE}`}
          >
            <Contrast className="h-4 w-4" aria-hidden />
            Alto contraste
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label="Accesibilidad"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#0F2C59] shadow-md transition hover:bg-neutral-50"
      >
        <Accessibility className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
