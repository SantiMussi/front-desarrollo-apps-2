import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const SIZE_CLASSES = {
  xs: { control: "px-2.5 py-2 text-xs border-slate-200", option: "px-3 py-1.5 text-xs" },
  sm: { control: "h-9 px-2.5 text-sm border-slate-300", option: "px-3 py-1.5 text-sm" },
};

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  disabled = false,
  ariaLabel,
  size = "sm",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selected = options.find((opt) => String(opt.value) === String(value));

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white text-left font-medium text-slate-700 outline-none transition focus:border-[#0F2C59] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${sizeClasses.control}`}
      >
        <span className={`truncate ${selected ? "" : "font-normal text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <ul role="listbox" className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-center justify-between gap-2 ${sizeClasses.option} ${isSelected ? "bg-blue-50 font-semibold text-[#0F2C59]" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
