import { Info } from "lucide-react";

export default function CatalogDependencyNotice({ children, tone = "info" }) {
  const styles = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[13px] ${styles}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}