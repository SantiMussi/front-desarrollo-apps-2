import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Send, TriangleAlert, X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { EMERGENCY_MESSAGE, QUICK_QUESTIONS, SUPPORT_EMAIL, SUPPORT_FAQ } from "../../data/supportFaq";
import { answerQuestion, claimPath } from "../../utils/supportAssistant";

const MAX_LENGTH = 300;

const WELCOME = {
  id: "welcome",
  from: "bot",
  text: "Hola, soy el asistente de ayuda de Ciudad UADE. No soy una persona ni una inteligencia artificial: te oriento con respuestas preparadas. Por favor, no escribas contraseñas ni datos personales.",
};

const NOT_FOUND =
  `No encontré una respuesta para eso. Probá con otras palabras (por ejemplo «luz apagada» o «bache»), mirá las preguntas de abajo o escribinos a ${SUPPORT_EMAIL}.`;

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
  const listRef = useRef(null);
  const counter = useRef(0);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const push = (...items) => setMessages((current) => [...current, ...items.map((item) => ({ ...item, id: `m${counter.current++}` }))]);

  const reply = (result) => {
    if (result.type === "faq") {
      push({ from: "bot", text: result.faq.answer, action: result.faq.action, emergency: result.emergency });
    } else if (result.type === "requestTypes") {
      push({ from: "bot", text: "Esto parece ir con alguno de estos temas. Tocá el que más se parezca para empezar el reclamo:", suggestions: result.suggestions, emergency: result.emergency });
    } else {
      push({ from: "bot", text: loading ? "Todavía estoy cargando los temas. Probá de nuevo en unos segundos." : NOT_FOUND, emergency: result.emergency });
    }
  };

  const ask = (text) => {
    const clean = text.trim().slice(0, MAX_LENGTH);
    if (!clean) return;
    push({ from: "user", text: clean });
    reply(answerQuestion(clean, categories));
  };

  const askFaq = (faq) => {
    push({ from: "user", text: faq.question });
    reply({ type: "faq", faq });
  };

  const submit = (event) => {
    event.preventDefault();
    ask(draft);
    setDraft("");
  };

  const quick = QUICK_QUESTIONS.map((id) => SUPPORT_FAQ.find((faq) => faq.id === id)).filter(Boolean);

  return (
    <div
      role="dialog"
      aria-label="Asistente de ayuda"
      hidden={!open}
      style={zoom === 1 ? undefined : { zoom }}
      className="mb-2 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
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
      <div className="flex flex-wrap gap-1.5 border-t border-neutral-100 px-3 pt-2.5">
        {quick.map((faq) => (
          <button
            key={faq.id}
            type="button"
            onClick={() => askFaq(faq)}
            className="rounded-full border border-neutral-300 px-2.5 py-1 text-[12px] font-medium text-[#0F2C59] hover:bg-neutral-50"
          >
            {faq.question}
          </button>
        ))}
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
