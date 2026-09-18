import { AlertCircle, ChevronRight, Loader2 } from "lucide-react";

export default function CatalogEntityTable({ items, loading, error, emptyMessage, columns, onRowClick }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#0F2C59]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (!items.length) {
    return <p className="py-12 text-center text-[13px] text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2.5 font-semibold">
                {col.label}
              </th>
            ))}
            {onRowClick && <th className="w-8" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={`bg-white ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
              {onRowClick && (
                <td className="px-2 text-slate-300">
                  <ChevronRight className="h-4 w-4" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
