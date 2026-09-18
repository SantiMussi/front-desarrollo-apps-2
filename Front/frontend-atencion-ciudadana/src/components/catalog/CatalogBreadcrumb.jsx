import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CatalogBreadcrumb({ items }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            {isLast || !item.to ? (
              <span className={isLast ? "font-semibold text-slate-800" : ""}>{item.label}</span>
            ) : (
              <Link to={item.to} className="hover:text-[#0F2C59] hover:underline">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
