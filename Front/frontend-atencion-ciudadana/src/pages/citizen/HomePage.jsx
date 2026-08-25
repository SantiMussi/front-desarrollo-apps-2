import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardList, FileText, CreditCard, CheckCircle } from "lucide-react";
import CategoryCard from "../../components/ui/CategoryCard";
import SearchBar from "../../components/ui/SearchBar";
import logo from "../../assets/logo.png";
import { MOCK_CATEGORIES } from "../../data/mockCategories";

/* HomePage */
export default function HomePage() {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState("");

  return (
    <div className="flex flex-col min-h-[calc(100svh-58px)] bg-[#fafafa]">
      {/* HERO ASYMMETRICAL & EDITORIAL (Con "Chucu" pero sin cara de IA) */}
      <section className="relative w-full bg-white border-b border-neutral-200 overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0F2C59] to-[#D63031]" />

        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left Content */}
            <div className="flex-1 w-full z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[2px] bg-[#D63031]" />
                <span className="text-[#D63031] text-[13px] font-bold tracking-[0.2em] uppercase">
                  Municipalidad
                </span>
              </div>

              <h1 className="text-[3rem] sm:text-[4rem] lg:text-[4.5rem] leading-[1.05] font-extrabold text-[#0F2C59] tracking-[-0.03em] mb-6">
                Tu ciudad, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63031] to-[#e74c3c]">
                  más simple.
                </span>
              </h1>

              <p className="text-lg sm:text-[19px] text-neutral-500 max-w-xl mb-10 leading-relaxed font-medium">
                Un canal digital directo para gestionar tus trámites, reclamos y consultas de forma rápida, sin filas y desde cualquier dispositivo.
              </p>

              {/* Buscador */}
              <SearchBar />
            </div>

            {/* Right Content */}
            <div className="hidden lg:flex w-[450px] shrink-0 relative items-center justify-center" style={{ perspective: "1000px" }}>
              {/* Decorative background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-[#0F2C59]/15 to-[#D63031]/15 rounded-full blur-[80px]" />

              {/* Decorative concentric circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-neutral-300/25 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-neutral-400/20 pointer-events-none" />

              {/* Floating Wrapper */}
              <div className="transform transition-transform duration-700 ease-out hover:scale-105 hover:rotate-0" style={{ transform: "rotateY(-12deg) rotateZ(4deg)" }}>

                {/* Phone  */}
                <div className="relative w-[280px] h-[560px] bg-[#fafafa] rounded-[3rem] border-[12px] border-neutral-900 shadow-2xl shadow-black/20 overflow-hidden flex flex-col">

                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-sm border border-white/5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-80" />
                  </div>

                  {/* Phone Header / App Bar */}
                  <div className="bg-white px-5 pt-10 pb-4 shadow-sm border-b border-neutral-100 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center">
                        <img src={logo} alt="Logo" className="w-6 h-6 object-contain opacity-50" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hola, vecino</p>
                        <p className="text-[13px] font-extrabold text-[#0F2C59]">Mi Ciudad UADE</p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Body */}
                  <div className="flex-1 p-4 flex flex-col gap-4 relative">
                    <div className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#D63031]" />
                      <div className="h-28 bg-neutral-200 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center border border-neutral-100">
                        <iframe
                          title="Mapa de Bacheo"
                          frameBorder="0"
                          scrolling="no"
                          src="https://www.openstreetmap.org/export/embed.html?bbox=-58.494,-34.608,-58.486,-34.602&layer=mapnik"
                          className="absolute w-[500px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80 max-w-none"
                          style={{ filter: 'grayscale(0.7) contrast(1.1)' }}
                        />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-8 h-8 bg-[#D63031]/10 rounded-full flex items-center justify-center shadow-sm">
                            <div className="w-3.5 h-3.5 bg-[#D63031] rounded-full shadow-md border-[1.5px] border-white relative z-10" />
                            <div className="absolute w-full h-full rounded-full border border-[#D63031]/20 animate-ping" style={{ animationDuration: '3s' }} />
                          </div>
                          <div className="w-0.5 h-3 bg-gradient-to-b from-[#D63031] to-transparent opacity-60 mt-[-2px]" />
                        </div>
                      </div>
                      <p className="text-[13px] font-bold text-neutral-900 mb-1">Reparación de Bacheo</p>
                      <p className="text-[11px] text-neutral-500 mb-3">Calle Campana 3240</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#D63031] w-[60%] rounded-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#D63031]">En curso</span>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-neutral-900 mb-3 px-1">Últimos movimientos</p>
                      <div className="flex flex-col gap-2">
                        <div className="bg-white p-3 rounded-xl border border-neutral-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-[#0F2C59]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-bold text-neutral-900 leading-tight">Licencia</p>
                            <p className="text-[10px] text-neutral-400">Trámite aprobado</p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-neutral-100 flex items-center gap-3 opacity-50">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-neutral-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-bold text-neutral-900 leading-tight">Pago ABL</p>
                            <p className="text-[10px] text-neutral-400">Impactado</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Faux Bottom Navigation */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[100px] h-1.5 bg-neutral-300 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="absolute top-32 -right-6 bg-white py-2.5 px-4 rounded-xl shadow-xl shadow-[#D63031]/5 border border-[#D63031]/10 transform rotate-6 z-20">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D63031] opacity-50"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D63031]"></span>
                  </span>
                  <span className="text-[12px] font-bold text-neutral-700">Cuadrilla en camino</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
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
                  if (category.id === "otro") {
                    navigate("/portal-ayuda?category=otro&subcategory=otro-general&requestType=OTRO_CONSULTA_GENERAL");
                  } else {
                    navigate(`/portal-ayuda?category=${category.id}`);
                  }
                }}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
