import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Ticket, Users, BarChart, LogOut, Menu, X } from "lucide-react";
import logo from "../../assets/logo.png";

export default function AgentSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/agente/dashboard", icon: LayoutDashboard },
    { name: "Tickets", path: "/agente/tickets", icon: Ticket },
    { name: "Agentes", path: "/agente/agentes", icon: Users },
    { name: "Métricas", path: "/agente/metricas", icon: BarChart },
  ];

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#f3f4f6] border-r border-slate-200 flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200/60">
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Atención Vecinal</h1>
            <span className="text-xs text-slate-500">Panel de Gestión</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-[#0F2C59] text-white" 
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/60 mt-auto">
          <button className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-slate-800">Panel de Gestión</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 pt-16">
          <div className="bg-white h-full w-64 p-4 flex flex-col shadow-xl">
             <nav className="flex-1 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive 
                        ? "bg-[#0F2C59] text-white" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200/60 mt-auto">
              <button className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
