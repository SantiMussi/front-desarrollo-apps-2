import { ArrowUpRight, icons } from "lucide-react";

/* CategoryCard */
export default function CategoryCard({
  title,
  description,
  iconName,
  itemCount,
  badgeText,
  onClick,
}) {
  const IconComponent = icons[iconName];

  const badgeStyles = {
    Popular: "bg-[#0F2C59]/5 text-[#0F2C59]",
    Nuevo: "bg-emerald-50 text-emerald-600",
    Urgente: "bg-[#D63031]/5 text-[#D63031]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 text-left
                 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                 hover:border-[#D63031]/20 hover:shadow-[0_4px_24px_-6px_rgba(214,48,49,0.08)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031]/40 focus-visible:ring-offset-2"
    >
      {/* Coral accent line on hover — top edge */}
      <div className="absolute top-0 left-3 right-3 h-0.5 bg-[#D63031] rounded-full scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex items-start justify-between">
        <div className="text-neutral-400 transition-colors duration-300 group-hover:text-[#D63031]">
          {IconComponent ? (
            <IconComponent className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <span className="text-xs">?</span>
          )}
        </div>
        {badgeText && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles[badgeText] || "bg-neutral-100 text-neutral-500"
              }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-neutral-900 leading-snug group-hover:text-[#0F2C59] transition-colors">
          {title}
        </h3>
        <p className="text-[13px] text-neutral-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-300 tabular-nums">
          {itemCount} activos
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-neutral-300 transition-all duration-300
                     group-hover:text-[#D63031] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          strokeWidth={1.5}
        />
      </div>
    </button>
  );
}
