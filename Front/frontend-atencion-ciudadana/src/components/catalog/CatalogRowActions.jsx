import { Loader2, Pencil, Power } from "lucide-react";

export default function CatalogRowActions({
  active,
  onEdit,
  onToggleActive,
  toggleDisabled,
  toggleDisabledReason,
  editDisabled,
  editDisabledReason,
  busy,
}) {
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onEdit}
        disabled={editDisabled || busy}
        title={editDisabled ? editDisabledReason : "Editar"}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F2C59] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onToggleActive}
        disabled={toggleDisabled || busy}
        title={toggleDisabled ? toggleDisabledReason : active ? "Desactivar" : "Activar"}
        className={`rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100 hover:text-[#0F2C59]"
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
      </button>
    </div>
  );
}
