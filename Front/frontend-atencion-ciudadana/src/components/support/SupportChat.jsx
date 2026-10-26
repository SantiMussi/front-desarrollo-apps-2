import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LifeBuoy, Send, TriangleAlert, X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import {
  EMERGENCY_MESSAGE,
  PRIVACY_NOTE,
  SUPPORT_EMAIL,
  SUPPORT_TOPICS,
  TICKET_SCOPE_ANSWER,
  faqById,
  faqsForTopic,
} from "../../data/supportFaq";
import { answerQuestion, claimPath, redactPersonalData } from "../../utils/supportAssistant";

const MAX_LENGTH = 300;

const WELCOME = {
  id: "welcome",
  from: "bot",
  text: "Hola, soy el asistente de ayuda de Ciudad UADE. No soy una persona ni una inteligencia artificial: te oriento con respuestas preparadas sobre cómo usar el sitio. Tu reclamo siempre lo atiende una persona del equipo. Por favor, no escribas contraseñas ni datos personales.",
};

const NOT_FOUND =
  `No encontré una respuesta para eso. Probá con otras palabras (por ejemplo «luz apagada» o «seguir mi reclamo»), elegí un tema de abajo o escribinos a ${SUPPORT_EMAIL}.`;

const CHIP = "rounded-full border border-neutral-300 px-2.5 py-1 text-[12px] font-medium text-[#0F2C59] hover:bg-neutral-50";

function Bubble({ message, onNavigate }) {
  const mine = message.from === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          mine ? "rounded-br-sm bg-[#0F2C59] text-white" : "rounded-bl-sm bg-neutral-100 text-neutral-800"
        }`}
      >
        {message.emergency && (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-[12.5px] font-semibold text-red-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {EMERGENCY_MESSAGE}
          </p>
        )}
        <p>{message.text}</p>
        {message.suggestions && (
          <ul className="mt-2 space-y-1.5">
            {message.suggestions.map((item) => (
              <li key={item.requestType.id}>
                <Link
                  to={claimPath(item)}
                  onClick={onNavigate}
                  className="block rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[#0F2C59] hover:bg-blue-50"
                >
                  <span className="block text-[13px] font-semibold">{item.requestType.name}</span>
                  <span className="block text-[11.5px] text-neutral-500">{item.category.title} · {item.subcategory.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {message.action && (
          <Link
            to={message.action.to}
            onClick={onNavigate}
            className="mt-2 inline-block rounded-lg bg-[#0F2C59] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#163d75]"
          >
            {message.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

// El catálogo se pide recién cuando alguien abre el chat, para no sumar carga al resto del sitio.
function SupportChatPanel({ open, onClose, zoom }) {
  const { categories, loading } = useCategories();
  const [messages, setMessages] = useState([WELCOME]);
  const [draft, setDraft] = useState("");
  const [chips, setChips] = useState({ mode: "topics" });
  const listRef = useRef(null);
  const counter = useRef(0);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const push = (...items) => setMessages((current) => [...current, ...items.map((item) => ({ ...item, id: `m${counter.current++}` }))]);

  const showFaq = (faq, emergency = false) => {
    push({ from: "bot", text: faq.answer, action: faq.action, emergency });
    setChips(faq.related?.length ? { mode: "related", ids: faq.related } : { mode: "topics" });
  };

  const reply = (result) => {
    if (result.type === "faq") {
      showFaq(result.faq, result.emergency);
      return;
    }
    setChips({ mode: "topics" });
    if (result.type === "ticketCode") {
      push({ from: "bot", text: TICKET_SCOPE_ANSWER.text, action: TICKET_SCOPE_ANSWER.action, emergency: result.emergency });
    } else if (result.type === "requestTypes") {
      push({ from: "bot", text: "Esto parece ir con alguno de estos temas. Tocá el que más se parezca para empezar el reclamo:", suggestions: result.suggestions, emergency: result.emergency });
    } else {
      push({ from: "bot", text: loading ? "Todavía estoy cargando los temas. Probá de nuevo en unos segundos." : NOT_FOUND, emergency: result.emergency });
    }
  };

  const ask = (text) => {
    const { text: safe, redacted } = redactPersonalData(text.trim().slice(0, MAX_LENGTH));
    if (!safe) return;
    push({ from: "user", text: safe });
    if (redacted) push({ from: "bot", text: PRIVACY_NOTE });
    reply(answerQuestion(safe, categories));
  };

  const askFaq = (faq) => {
    push({ from: "user", text: faq.question });
    showFaq(faq);
  };

  const submit = (event) => {
    event.preventDefault();
    ask(draft);
    setDraft("");
  };

  const chipFaqs =
    chips.mode === "topic" ? faqsForTopic(chips.id) : chips.mode === "related" ? chips.ids.map(faqById).filter(Boolean) : [];

  return (
    <div
      role="dialog"
      aria-label="Asistente de ayuda"
      hidden={!open}
      style={zoom === 1 ? undefined : { zoom }}
      className="mb-2 flex h-[min(34rem,75vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between bg-[#0F2C59] px-4 py-3 text-white">
        <div>
          <p className="text-[14px] font-bold">Asistente de ayuda</p>
          <p className="text-[11.5px] text-blue-100">Respuestas preparadas · no guardamos lo que escribís</p>
        </div>
        <button type="button" aria-label="Cerrar asistente" onClick={onClose} className="rounded-md p-1 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={listRef} role="log" aria-live="polite" aria-label="Conversación" className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.map((message) => (
          <Bubble key={message.id} message={message} onNavigate={onClose} />
        ))}
      </div>
      <div className="max-h-36 overflow-y-auto border-t border-neutral-100 px-3 pt-2.5">
        <p className="mb-1.5 text-[11.5px] font-medium text-neutral-500">
          {chips.mode === "topics" ? "Elegí un tema:" : chips.mode === "topic" ? "Preguntas frecuentes:" : "Para seguir:"}
        </p>
        <div className="flex flex-wrap gap-1.5 pb-1">
          {chips.mode === "topics"
            ? SUPPORT_TOPICS.map((topic) => (
                <button key={topic.id} type="button" onClick={() => setChips({ mode: "topic", id: topic.id })} className={CHIP}>
                  {topic.label}
                </button>
              ))
            : (
              <>
                {chipFaqs.map((faq) => (
                  <button key={faq.id} type="button" onClick={() => askFaq(faq)} className={CHIP}>
                    {faq.question}
                  </button>
                ))}
                <button type="button" onClick={() => setChips({ mode: "topics" })} className={`${CHIP} inline-flex items-center gap-1`}>
                  <ArrowLeft className="h-3 w-3" aria-hidden />
                  Todos los temas
                </button>
              </>
            )}
        </div>
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 p-3">
        <label htmlFor="support-chat-input" className="sr-only">Escribí tu pregunta</label>
        <input
          id="support-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_LENGTH}
          autoComplete="off"
          placeholder="Ej.: luz apagada en la calle"
          className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-[13.5px] outline-none focus:border-[#0F2C59]"
        />
        <button
          type="submit"
          aria-label="Enviar pregunta"
          disabled={!draft.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D63031] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default function SupportChat({ zoom = 1 }) {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);

  const toggle = () => {
    setStarted(true);
    setOpen((value) => !value);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {started && <SupportChatPanel open={open} onClose={() => setOpen(false)} zoom={zoom} />}
      <button
        type="button"
        aria-label="Ayuda"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-12 items-center gap-2 rounded-full bg-[#0F2C59] px-4 text-[13px] font-semibold text-white shadow-lg transition hover:bg-[#163d75]"
      >
        <LifeBuoy className="h-5 w-5" aria-hidden />
        Ayuda
      </button>
    </div>
  );
}
