import { Check, X } from "lucide-react";

const STEPS = [
  { label: "Categoría" },
  { label: "Subcategoría" },
  { label: "Tipo" },
  { label: "Formulario" },
];

export default function StepIndicator({ currentStep = 0, status = 'idle' }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        let isCompleted = index < currentStep;
        let isCurrent = index === currentStep;
        
        let showSuccess = false;
        let showError = false;

        // Si estamos en el último paso (Formulario)
        if (index === 3) {
          if (status === 'success') {
            isCompleted = true;
            isCurrent = false;
            showSuccess = true;
          } else if (status === 'error') {
            showError = true;
          }
        }

        return (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300
                  ${isCompleted || showSuccess
                    ? "bg-[#D63031] text-white"
                    : showError
                      ? "bg-[#D63031] text-white" // rojo con cruz blanca
                      : isCurrent
                        ? "bg-[#0F2C59] text-white ring-2 ring-[#0F2C59]/20"
                        : "bg-neutral-100 text-neutral-400"
                  }`}
              >
                {isCompleted || showSuccess ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : showError ? (
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`hidden sm:inline text-[12px] transition-colors ${
                  isCurrent
                    ? "font-semibold text-neutral-800"
                    : isCompleted
                      ? "text-neutral-500"
                      : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-px w-6 sm:w-10 transition-colors ${
                  isCompleted ? "bg-[#D63031]" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
