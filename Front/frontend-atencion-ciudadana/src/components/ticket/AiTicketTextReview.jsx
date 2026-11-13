import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { classifyTicketText } from "../../services/apiClient";
import { EMERGENCY_MESSAGE } from "../../data/supportFaq";
import { isEmergency } from "../../utils/supportAssistant";
import { MIN_REVIEW_CHARS, buildReview, claimTypeLabel, findRequestTypePath } from "../../utils/aiTicketReview";

const QUALITY_MESSAGES = {
  TOO_VAGUE: "Es difícil entender qué querés reclamar. Contá qué pasó, dónde y desde cuándo.",
  OFF_TOPIC: "Esto no parece un tema de servicios municipales. Revisá que estés en el trámite correcto.",
};

/**
 * Revisión opcional de lo que escribió la persona: sugiere el tipo de trámite y avisa si el texto es
 * poco claro. Sólo se ejecuta al pedirla (cada revisión consume cuota del servidor) y nunca cambia el
 * reclamo por su cuenta. Sin IA disponible cae en la búsqueda por palabras clave.
 */
export default function AiTicketTextReview({ summary, description, requestType, catalog, onChangeRequestType, disabled }) {
  const [state, setState] = useState({ status: "idle", review: null, key: null, notice: null });
  const [dismissedKey, setDismissedKey] = useState(null);

  const text = description.trim();
  const key = `${requestType?.id}|${summary.trim()}|${text}`;
  const tooShort = text.length < MIN_REVIEW_CHARS;
  const stale = state.key !== key;
  const emergency = isEmergency(`${summary} ${description}`);

  const run = async () => {
    if (tooShort || state.status === "loading") return;
    setState({ status: "loading", review: null, key, notice: null });
    setDismissedKey(null);
    let response = null;
    let notice = null;
    try {
      response = await classifyTicketText({ summary: summary.trim(), description: text, requestTypeId: Number(requestType?.id) || null });
    } catch (err) {
      notice = err?.status === 429
        ? "Hiciste muchas revisiones seguidas. Te mostramos una sugerencia más simple."
        : null;
    }
    const review = buildReview({
      response, categories: catalog, summary, description: text, currentRequestTypeId: requestType?.id,
    });
    setState({ status: "done", review, key, notice });
  };

  const applySuggestion = (path) => {
    onChangeRequestType?.(path.requestType.id);
    setState({ status: "idle", review: null, key: null, notice: null });
  };

  const review = state.status === "done" && !stale ? state.review : null;
  const showMismatch = review?.mismatch && review.suggestion && dismissedKey !== key;
  const currentPath = findRequestTypePath(catalog, requestType?.id);
  const qualityMessage = review?.mode === "ai" ? QUALITY_MESSAGES[review.quality] : null;
  const settled = review && !review.mismatch && !qualityMessage;
  const allGood = settled && (review.mode === "ai" || Boolean(review.suggestion));
  const noResult = settled && !allGood;

  return (
    <div className="space-y-2" data-testid="ai-ticket-review">
      {emergency && (
        <div role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{EMERGENCY_MESSAGE}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={disabled || tooShort || state.status === "loading"}
          className="inline-flex items-center gap-2 rounded-md border border-[#0F2C59]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F2C59] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
          Revisar mi reclamo
        </button>
        <span className="text-[11px] text-neutral-500">
          {tooShort
            ? `Escribí al menos ${MIN_REVIEW_CHARS} caracteres para poder revisarlo.`
            : "Opcional: te sugiere el tema más adecuado y avisa si falta claridad."}
        </span>
      </div>

      <div aria-live="polite" className="space-y-2">
        {state.notice && !stale && <p className="text-[11px] text-amber-700">{state.notice}</p>}

        {qualityMessage && (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{qualityMessage}</span>
          </div>
        )}

        {showMismatch && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-950">
            <p>
              Por lo que escribiste, tu reclamo parece corresponder a <strong>{claimTypeLabel(review.suggestion)}</strong>
              {currentPath ? <>, y elegiste <strong>{currentPath.requestType.name}</strong></> : null}.
              {review.reason ? ` ${review.reason}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => applySuggestion(review.suggestion)}
                className="rounded-md bg-[#0F2C59] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a1f40]">
                Cambiar a «{review.suggestion.requestType.name}»
              </button>
              <button type="button" onClick={() => setDismissedKey(key)}
                className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100">
                Mantener mi elección
              </button>
            </div>
          </div>
        )}

        {allGood && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            El tema elegido coincide con lo que escribiste.
          </p>
        )}

        {noResult && <p className="text-xs text-neutral-600">No encontramos otro tema que se ajuste mejor a lo que escribiste.</p>}

        {review && (
          <p className="text-[10px] text-neutral-500">
            {review.mode === "ai"
              ? "Sugerencia automática con inteligencia artificial: puede equivocarse, la decisión es tuya."
              : "Sugerencia por palabras clave: puede equivocarse, la decisión es tuya."}
          </p>
        )}
      </div>
    </div>
  );
}
