import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Ticket, User, Menu, X, Headset, LogOut, ChevronDown, UserCircle, KeyRound } from "lucide-react";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../ui/UserAvatar";

const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-neutral-600 " +
  "transition-colors hover:bg-neutral-50 hover:text-[#0F2C59]";

/* CitizenNavbar */
export default function CitizenNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const displayName =
    user?.displayName || user?.firstName || user?.nombre || user?.name || user?.email || "";
  const secondaryLine =
    user && user.subjectId && user.subjectId !== displayName ? user.subjectId : null;

  // Close the account dropdown on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const closeUserMenu = () => setIsUserMenuOpen(false);

  const isStaff = ["AGENT", "ADMIN"].includes(user?.role);

  // Links inside the account dropdown (differ for logged-in vs guest)
  const menuLinks = user
    ? [
        ...(isStaff ? [{ icon: Headset, label: "Vista agente", to: "/agente/tickets" }] : []),
        { icon: Ticket, label: "Mis reclamos", to: "/mis-reclamos" },
        { icon: KeyRound, label: "Ingresar un código de seguimiento", to: "/seguimiento" },
        { icon: UserCircle, label: "Cuenta", to: "/cuenta" },
      ]
    : [
        { icon: User, label: "Ingresar", to: "/ingresar" },
        { icon: UserCircle, label: "Crear cuenta", to: "/registro" },
        { icon: KeyRound, label: "Ingresar un código de seguimiento", to: "/seguimiento" },
      ];

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
          {/* Account dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              className="flex items-center gap-1.5 rounded-lg border border-[#0F2C59]/10 bg-[#0F2C59]/5 px-3 py-1.5 text-[13px] font-medium text-[#0F2C59]
                         transition-all hover:bg-[#0F2C59]/10"
            >
              {user ? <UserAvatar user={user} size="sm" /> : <User className="h-3.5 w-3.5" strokeWidth={2} />}
              <span className="max-w-[140px] truncate">{user ? displayName : "Ingresar"}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/5"
              >
                {user && (
                  <>
                    <div className="px-3 py-2">
                      <p className="truncate text-[13px] font-semibold text-[#0F2C59]">{displayName}</p>
                      {secondaryLine && (
                        <p className="truncate text-[11px] text-neutral-400">{secondaryLine}</p>
                      )}
                    </div>
                    <div className="my-1 h-px bg-neutral-100" />
                  </>
                )}

                {menuLinks.map(({ icon: Icon, label, to }) => (
                  <Link key={to} to={to} onClick={closeUserMenu} role="menuitem" className={MENU_ITEM}>
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {label}
                  </Link>
                ))}

                {user && (
                  <>
                    <div className="my-1 h-px bg-neutral-100" />
                    <button
                      type="button"
                      onClick={() => {
                        closeUserMenu();
                        logout();
                      }}
                      role="menuitem"
                      className={`${MENU_ITEM} hover:bg-red-50 hover:text-[#D63031]`}
                    >
                      <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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
          {user && (
            <div className="mb-2 flex items-center gap-2.5 px-3 py-2">
              <UserAvatar user={user} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#0F2C59]">{displayName}</p>
                {secondaryLine && (
                  <p className="truncate text-[11px] text-neutral-400">{secondaryLine}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {menuLinks.map(({ icon: Icon, label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </Link>
            ))}

            {user && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-600 hover:bg-red-50 hover:text-[#D63031]"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Cerrar sesión
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
