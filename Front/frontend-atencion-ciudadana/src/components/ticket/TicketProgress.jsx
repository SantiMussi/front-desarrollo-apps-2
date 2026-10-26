import { Check, Info } from "lucide-react";
import { CITIZEN_STATUS_GUIDE, PROGRESS_STEPS, progressStepIndex } from "../../constants/citizenStatusGuide";

export default function TicketProgress({ status, history }) {
  const guide = CITIZEN_STATUS_GUIDE[status];
  if (!guide) return null;
  const current = progressStepIndex(status, history);
  const showSteps = current >= 0;

  return (
    <section aria-label="Estado de tu reclamo" className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
      {showSteps && (
        <ol className="flex items-start">
          {PROGRESS_STEPS.map((step, index) => {
            const done = index < current || (index === current && status === "CLOSED");
            const active = index === current && !done;
            return (
              <li
                key={step.key}
                aria-current={active ? "step" : undefined}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                {index > 0 && (
                  <span
                    aria-hidden
                    className={`absolute right-1/2 top-3.5 h-0.5 w-full ${index <= current ? "bg-emerald-400" : "bg-neutral-200"}`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : active
                        ? "border-[#0F2C59] bg-white text-[#0F2C59] ring-4 ring-blue-100"
                        : "border-neutral-200 bg-white text-neutral-300"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={`mt-2 text-[11.5px] leading-tight ${active ? "font-bold text-[#0F2C59]" : done ? "font-medium text-neutral-600" : "text-neutral-400"}`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div
        className={`${showSteps ? "mt-5" : ""} flex items-start gap-3 rounded-xl px-4 py-3 ${
          guide.attention ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-900"
        }`}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="text-[13.5px] font-semibold">{guide.title}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed opacity-90">{guide.text}</p>
        </div>
      </div>
    </section>
  );
}
