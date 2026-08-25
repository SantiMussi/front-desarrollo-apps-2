import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ArrowLeft, ShieldAlert } from "lucide-react";

export default function ConfirmExitModal({ isOpen, onConfirm, onCancel }) {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

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
          {/* Backdrop con blur */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            {/* Top accent stripe */}
            <div className="h-1.5 bg-gradient-to-r from-[#0F2C59] via-[#D63031] to-[#0F2C59]" />

            {/* Close button */}
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all z-10"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {/* Body */}
            <div className="px-6 pt-7 pb-6">
              {/* Animated icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  className="relative"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                >
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" style={{ animationDuration: "2s" }} />
                  {/* Second ring */}
                  <div className="absolute -inset-2 rounded-full border-2 border-dashed border-amber-300/30 animate-spin" style={{ animationDuration: "8s" }} />
                  {/* Icon container */}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 shadow-lg shadow-amber-500/10">
                    <ShieldAlert className="h-8 w-8 text-amber-600" strokeWidth={1.8} />
                  </div>
                </motion.div>
              </div>

              {/* Title */}
              <motion.h3
                className="text-center text-xl font-extrabold text-neutral-900 tracking-tight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                ¿Querés salir del formulario?
              </motion.h3>

              {/* Description */}
              <motion.p
                className="mt-2.5 text-center text-[14px] text-neutral-500 leading-relaxed max-w-sm mx-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Si salís ahora, <span className="font-semibold text-neutral-700">todo el progreso que realizaste se va a perder</span> y vas a tener que empezar de nuevo.
              </motion.p>

              {/* Warning badge */}
              <motion.div
                className="mt-4 mx-auto flex items-center justify-center gap-2 rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 max-w-xs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                <span className="text-[12px] font-medium text-amber-700">
                  Esta acción no se puede deshacer
                </span>
              </motion.div>
            </div>

            {/* Buttons */}
            <motion.div
              className="flex gap-3 border-t border-neutral-100 bg-neutral-50/50 px-6 py-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13px] font-semibold text-neutral-700
                           transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59]/20 focus-visible:ring-offset-1"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#D63031] px-4 py-3 text-[13px] font-semibold text-white
                           transition-all duration-200 hover:bg-[#c0282a] hover:shadow-md hover:shadow-[#D63031]/20 active:scale-[0.98]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031] focus-visible:ring-offset-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                Sí, salir
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
