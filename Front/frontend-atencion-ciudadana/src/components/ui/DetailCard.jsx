export default function DetailCard({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}