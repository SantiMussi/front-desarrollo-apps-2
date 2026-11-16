import { Plus } from "lucide-react";

export default function CatalogCreateButton({ label, onClick, disabled, disabledReason }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1a3f7a] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
