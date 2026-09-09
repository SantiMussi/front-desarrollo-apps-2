import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, LockKeyhole, Mail, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Modal de login rápido. Se usa cuando un vecino intenta enviar un reclamo
 * sin haber iniciado sesión: inicia sesión sin salir del formulario, así no
 * pierde lo que cargó. Al autenticarse llama `onAuthenticated()`.
 */
export default function LoginPromptModal({ isOpen, onClose, onAuthenticated }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setForm({ username: "", password: "" });
    setError("");
    setShowPassword(false);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  // Bloquear scroll del body + cerrar con ESC
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  const update = ({ target }) =>
    setForm((current) => ({ ...current, [target.name]: target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      resetForm();
      onAuthenticated();
    } catch (err) {
      setError(err?.message || "No pudimos iniciar sesión. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#0F2C59] via-[#D63031] to-[#0F2C59]" />

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <div className="px-6 pb-2 pt-7">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2C59]/5 text-[#0F2C59]">
                  <LogIn className="h-7 w-7" strokeWidth={1.8} />
                </div>
              </div>

              <h3 className="text-center text-xl font-extrabold tracking-tight text-neutral-900">
                Iniciá sesión para enviar tu reclamo
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-center text-[13.5px] leading-relaxed text-neutral-500">
                Necesitás una cuenta para registrar tu solicitud y hacerle seguimiento.
                No vas a perder lo que ya cargaste.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-neutral-600">
                    Correo electrónico
                  </span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      name="username"
                      type="email"
                      autoComplete="username"
                      required
                      value={form.username}
                      onChange={update}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-[14px] outline-none transition-colors focus:border-[#0F2C59]/40 focus:bg-white focus:ring-2 focus:ring-[#0F2C59]/10"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-neutral-600">
                    Contraseña
                  </span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={form.password}
                      onChange={update}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-10 text-[14px] outline-none transition-colors focus:border-[#0F2C59]/40 focus:bg-white focus:ring-2 focus:ring-[#0F2C59]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#D63031] px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#c0282a] disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? "Ingresando..." : "Iniciar sesión y enviar"}
                </button>
              </form>
            </div>

            <div className="mt-2 border-t border-neutral-100 bg-neutral-50/60 px-6 py-3.5 text-center text-[12.5px] text-neutral-500">
              ¿Todavía no tenés cuenta?{" "}
              <Link
                to="/registro"
                state={{ message: "Creá tu cuenta para registrar tu reclamo." }}
                className="font-semibold text-[#0F2C59] hover:underline"
              >
                Registrate
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
