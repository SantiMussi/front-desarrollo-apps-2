import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Ticket, User, Menu, X } from "lucide-react";
import logo from "../../assets/logo.png";

/* CitizenNavbar */
export default function CitizenNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/95 backdrop-blur-md">

      <div className="h-0.5 bg-gradient-to-r from-[#D63031] via-[#e74c3c] to-[#D63031]" />

      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Ciudad UADE Logo" className="h-7 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-[14px] font-bold tracking-tight text-[#0F2C59]">
              Ciudad UADE
            </span>
            <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-neutral-400">
              Atención Vecinal
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-neutral-500
                       transition-colors hover:text-[#0F2C59] hover:bg-blue-50/50"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
            Buscar
            <kbd className="ml-1 rounded border border-neutral-200 bg-neutral-50 px-1 py-px text-[10px] text-neutral-400 font-mono">
              ⌘K
            </kbd>
          </button> */}

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-neutral-500
                       transition-colors hover:text-[#0F2C59] hover:bg-blue-50/50"
          >
            <Ticket className="h-3.5 w-3.5" strokeWidth={2} />
            Mi Reclamo
          </button>

          <div className="mx-2 h-4 w-px bg-neutral-200" />

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-[#0F2C59]/10 bg-[#0F2C59]/5 px-3 py-1.5 text-[13px] font-medium text-[#0F2C59]
                       transition-all hover:bg-[#0F2C59]/10"
          >
            <User className="h-3.5 w-3.5" strokeWidth={2} />
            Vecino
          </button>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-1.5 text-neutral-500 hover:text-[#0F2C59]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <nav className="border-t border-neutral-100 bg-white px-5 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {[
              { icon: Search, label: "Buscar" },
              { icon: Ticket, label: "Mi Reclamo" },
              { icon: User, label: "Ingresar como Vecino" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
