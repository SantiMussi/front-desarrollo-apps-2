import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/logo.png";

export default function AuthShell({ title, description, error, footer, children }) {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#0F2C59] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 top-1/3 h-96 w-96 rounded-full bg-[#D63031]/20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-3"><img src={logo} className="h-11 w-11 object-contain" alt="Ciudad UADE" /><span className="text-lg font-bold">Ciudad UADE</span></Link>
        <div className="relative max-w-lg"><p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-red-300">Atención vecinal</p><h1 className="text-5xl font-bold leading-tight">Tu ciudad, cada día más cerca.</h1><p className="mt-6 text-lg leading-8 text-blue-100">Ingresá para seguir tus reclamos, recibir novedades y comunicarte con nuestro equipo.</p></div>
        <p className="relative text-sm text-blue-200">Gestión simple, segura y transparente.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F2C59]"><ArrowLeft className="h-4 w-4" /> Volver al inicio</Link>
          <div className="mb-8 lg:hidden"><img src={logo} className="mb-4 h-12 w-12 object-contain" alt="Ciudad UADE" /></div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-slate-500">{description}</p>
          {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {children}
          <p className="mt-7 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </section>
    </main>
  );
}

export function AuthField({ icon: Icon, label, action, ...inputProps }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-[#0F2C59] focus-within:ring-2 focus-within:ring-[#0F2C59]/10"><Icon className="h-4 w-4 shrink-0 text-slate-400" /><input required className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-slate-300" {...inputProps} />{action}</span></label>;
}