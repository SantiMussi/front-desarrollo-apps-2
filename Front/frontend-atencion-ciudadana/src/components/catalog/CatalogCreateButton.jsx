import { Plus } from "lucide-react";

export default function CatalogCreateButton({ label, disabledReason }) {
  return (
    <button
      type="button"
      disabled
      title={disabledReason}
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] font-semibold text-slate-400"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
