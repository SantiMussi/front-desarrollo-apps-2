import { useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LockKeyhole, Mail, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import ModalDialog from "./ModalDialog";

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
  const titleId = useId();
  const descriptionId = useId();
  const emailRef = useRef(null);

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
        <ModalDialog
          labelledBy={titleId}
          describedBy={descriptionId}
          initialFocusRef={emailRef}
          lockScroll
          canDismiss={!loading}
          onDismiss={handleClose}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-black/20"
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
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
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

              <h3 id={titleId} className="text-center text-xl font-extrabold tracking-tight text-neutral-900">
                Iniciá sesión para enviar tu reclamo
              </h3>
              <p id={descriptionId} className="mx-auto mt-2 max-w-sm text-center text-[13.5px] leading-relaxed text-neutral-500">
                Necesitás una cuenta para registrar tu solicitud y hacerle seguimiento.
                No vas a perder lo que ya cargaste.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-neutral-600">
                    Correo electrónico
                  </span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      ref={emailRef}
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
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-neutral-600"
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

          </motion.div>
        </ModalDialog>
      )}
    </AnimatePresence>
  );
}
