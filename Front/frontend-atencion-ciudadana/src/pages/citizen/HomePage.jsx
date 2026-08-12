import { useState, useEffect } from "react";
import { Search, ArrowRight, ClipboardList, Phone, Mail, MapPin, ChevronRight, Activity, CheckCircle, Wrench, TreePine } from "lucide-react";
import CategoryCard from "../../components/ui/CategoryCard";
import logo from "../../assets/logo.png";
import { MOCK_CATEGORIES } from "../../data/mockCategories";

/* HomePage */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  const RECENT_EVENTS = [
    { id: 1, text: "Bacheo en Av. Lima", time: "Resuelto hace 2m", icon: CheckCircle, color: "text-green-400" },
    { id: 2, text: "Luminaria reparada", time: "Independencia 1100", icon: Wrench, color: "text-blue-400" },
    { id: 3, text: "Poda programada", time: "Vera Peñaloza", icon: TreePine, color: "text-orange-400" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % RECENT_EVENTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100svh-58px)]">
      {/*HERO */}
      <section className="hero-clip relative bg-[#0F2C59] overflow-hidden">
        {/* Luxury Pattern Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#0F2C59] via-[#0c244a] to-[#071630]">
          {/* Repeating Logo Pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.025] mix-blend-screen"
            style={{
              backgroundImage: `url(${logo})`,
              backgroundSize: '120px',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
              transform: 'rotate(-12deg) scale(1.5)'
            }}
          />

          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[100%] rounded-full bg-gradient-to-b from-[#2563eb] to-transparent opacity-25 blur-[120px] mix-blend-screen" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[80%] rounded-full bg-gradient-to-t from-[#D63031] to-transparent opacity-20 blur-[100px] mix-blend-screen" />
        </div>

        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#D63031] to-transparent opacity-40" />

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-24 lg:py-28">
          <div className="flex flex-col items-center text-center">
            {/* Center: text content */}
            <div className="max-w-2xl flex flex-col items-center">
              {/* Top Live Status Ticker */}
              <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-sm mb-6 shadow-md">
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <span className="text-[12px] font-bold text-white/70 tracking-[0.1em] uppercase">
                    En Vivo
                  </span>
                </div>
                
                <div className="h-5 w-px bg-white/20" />

                {/* The rolling container */}
                <div className="h-[24px] overflow-hidden relative w-[360px] text-left">
                  <div 
                    className="flex flex-col transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateY(-${activeEventIndex * 24}px)` }}
                  >
                    {RECENT_EVENTS.map((event) => (
                      <div key={event.id} className="h-[24px] flex items-center gap-2.5 shrink-0">
                        <event.icon className={`w-4 h-4 ${event.color}`} />
                        <span className="text-[14px] font-medium text-white/95 whitespace-nowrap">
                          {event.text}
                          <span className="text-white/50 font-normal ml-2">• {event.time}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h1 className="text-[clamp(2.5rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-white">
                ¿En qué te podemos
                <br />
                <span className="text-[#D63031]">ayudar</span> hoy?
              </h1>

              <p className="mt-5 text-[16px] text-blue-200/60 leading-relaxed max-w-lg">
                Iniciá un reclamo, consultá el estado de tu trámite o explorá
                los servicios de la Municipalidad de Ciudad UADE.
              </p>

              {/* Search */}
              <div className="mt-8 w-full max-w-lg">
                <div className="flex items-center gap-3 border-b border-white/15 pb-3 transition-colors focus-within:border-[#D63031]/50">
                  <Search className="h-5 w-5 text-white/30 shrink-0" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Buscá: baches, alumbrado, residuos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-[15px] text-white placeholder-white/25 outline-none"
                  />
                </div>
                <div className="mt-4 flex gap-2 flex-wrap justify-center">
                  {["Baches", "Alumbrado", "Poda", "Residuos", "Ruidos"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="rounded-full border border-white/8 px-3 py-1 text-[12px] text-white/40
                                 transition-all duration-200 hover:border-[#D63031]/40 hover:text-[#D63031]/90 hover:bg-[#D63031]/5"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>



            </div>
          </div>
        </div>
      </section>

      {/*MAIN CONTENT */}
      <div className="flex-1 bg-[#fafafa]">
        {/* Tracking strip */}
        <section className="border-b border-neutral-200/60 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 text-[13px] text-neutral-500 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D63031]/5">
                <ClipboardList className="h-3.5 w-3.5 text-[#D63031]" strokeWidth={1.5} />
              </div>
              <span className="font-medium">¿Ya hiciste un reclamo?</span>
            </div>
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                placeholder="Ingresá tu código de seguimiento"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[13px] text-neutral-900 placeholder-neutral-400 outline-none
                           transition-colors focus:border-[#D63031]/30 focus:bg-white focus:ring-1 focus:ring-[#D63031]/10"
              />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-4 py-1.5 text-[13px] font-medium text-white
                           transition-all duration-200 hover:bg-[#1a3f7a]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
              >
                Consultar
                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5 bg-[#D63031]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
                  Áreas de atención
                </span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                ¿Sobre qué es tu consulta?
              </h2>
            </div>
            <span className="hidden sm:inline text-[11px] text-neutral-300 tabular-nums">
              {MOCK_CATEGORIES.length} categorías
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                description={category.description}
                iconName={category.iconName}
                itemCount={category.itemCount}
                badgeText={category.badgeText}
                onClick={() => {
                  /* TODO: navigate to category detail */
                }}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 rotate-45 bg-[#D63031]/5" />
            </div>

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-neutral-900">
                  ¿No encontrás la categoría que necesitás?
                </p>
                <p className="text-[13px] text-neutral-400 mt-0.5">
                  Iniciá un reclamo general y nuestro equipo lo deriva al área correspondiente.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D63031] px-4 py-2 text-[13px] font-semibold text-white shrink-0
                           transition-all duration-200 hover:bg-[#c0282a] hover:shadow-md hover:shadow-[#D63031]/10
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031] focus-visible:ring-offset-2"
              >
                Reclamo General
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/*  FOOTER */}
      <footer className="border-t border-neutral-200/60 bg-white">
        <div className="h-px bg-gradient-to-r from-transparent via-[#D63031]/20 to-transparent" />

        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* Brand + contact */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="Ciudad UADE Logo" className="h-5 w-auto object-contain" />
                <span className="text-[13px] font-bold text-[#0F2C59]">Ciudad UADE</span>
              </div>
              <p className="text-[12px] text-neutral-400 leading-relaxed">
                Centro de Atención al Vecino.
                <br />
                Municipalidad de Ciudad UADE — Gestión 2026.
              </p>
              <div className="mt-4 flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <Phone className="h-3 w-3 text-[#D63031]/50" strokeWidth={1.5} /> 147 — Línea Municipal
                </span>
                <span className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <Mail className="h-3 w-3 text-[#D63031]/50" strokeWidth={1.5} /> atencion@ciudaduade.gob.ar
                </span>
                <span className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <MapPin className="h-3 w-3 text-[#D63031]/50" strokeWidth={1.5} /> Av. Independencia 1100, CABA
                </span>
              </div>
            </div>

            {/* Link columns */}
            <div className="flex gap-14">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-3">
                  Trámites
                </p>
                <ul className="flex flex-col gap-2">
                  {["Iniciar Reclamo", "Consultar Ticket", "Habilitaciones", "Turnos Online"].map(
                    (label) => (
                      <li key={label}>
                        <a href="#" className="link-hover text-[12px] text-neutral-500 hover:text-[#0F2C59] transition-colors">
                          {label}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-3">
                  Institucional
                </p>
                <ul className="flex flex-col gap-2">
                  {["Intendencia", "Transparencia", "Prensa", "Accesibilidad"].map((label) => (
                    <li key={label}>
                      <a href="#" className="link-hover text-[12px] text-neutral-500 hover:text-[#0F2C59] transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-5 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-[11px] text-neutral-300">
              © {new Date().getFullYear()} Municipalidad de Ciudad UADE. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-neutral-300">Todos los servicios operativos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
