import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleHelp, FilePlus, LifeBuoy, Pencil, Search, Send, TriangleAlert, X } from "lucide-react";
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
  text: "¡Hola! Soy el asistente de ayuda: no soy una persona ni una inteligencia artificial, solo tengo respuestas preparadas sobre el sitio. Tu reclamo siempre lo atiende una persona del equipo.",
};

const NOT_FOUND =
  `No encontré una respuesta para eso. Probá con otras palabras (por ejemplo «luz apagada» o «seguir mi reclamo»), elegí un tema de abajo o escribinos a ${SUPPORT_EMAIL}.`;

const TOPIC_ICONS = { claim: FilePlus, follow: Search, changes: Pencil, help: CircleHelp };

function BotAvatar() {
  return (
    <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F2C59] text-white">
      <LifeBuoy className="h-4 w-4" />
    </span>
  );
}

function Bubble({ message, onNavigate }) {
  const mine = message.from === "user";
  return (
    <div className={`flex items-start gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && <BotAvatar />}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          mine ? "rounded-br-sm bg-[#0F2C59] text-white" : "rounded-tl-sm bg-neutral-100 text-neutral-800"
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
          <ul className="mt-2.5 space-y-1.5">
            {message.suggestions.map((item) => (
              <li key={item.requestType.id}>
                <Link
                  to={claimPath(item)}
                  onClick={onNavigate}
                  className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[#0F2C59] transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <span>
                    <span className="block text-[13px] font-semibold">{item.requestType.name}</span>
                    <span className="block text-[11.5px] text-neutral-500">{item.category.title} · {item.subcategory.name}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {message.action && (
          <Link
            to={message.action.to}
            onClick={onNavigate}
            className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[#D63031] px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#bb292a]"
          >
            {message.action.label}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

// Opciones de respuesta rápida: viven dentro de la conversación, debajo del último mensaje del asistente.
function QuickReplies({ chips, onTopic, onQuestion, onAllTopics, faqs }) {
  const label = chips.mode === "topics" ? "Elegí un tema:" : chips.mode === "topic" ? "Preguntas frecuentes:" : "Para seguir:";
  return (
    <div className="pl-9">
      <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      {chips.mode === "topics" ? (
        <div className="grid grid-cols-2 gap-2">
          {SUPPORT_TOPICS.map((topic) => {
            const Icon = TOPIC_ICONS[topic.id] ?? CircleHelp;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onTopic(topic.id)}
                className="flex flex-col items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#0F2C59]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[12.5px] font-semibold leading-tight text-[#0F2C59]">{topic.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {faqs.map((faq) => (
            <button
              key={faq.id}
              type="button"
              onClick={() => onQuestion(faq)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-[13px] font-medium text-[#0F2C59] transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              {faq.question}
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={onAllTopics}
            className="inline-flex items-center gap-1 px-1 pt-1 text-[12.5px] font-semibold text-neutral-500 hover:text-[#0F2C59]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Todos los temas
          </button>
        </div>
      )}
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
  const lastRef = useRef(null);
  const counter = useRef(0);

  // Muestra el comienzo de la última respuesta, no el final de las opciones.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = lastRef.current ? Math.max(lastRef.current.offsetTop - 8, 0) : list.scrollHeight;
  }, [messages, chips, open]);

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
      className="mb-2 flex h-[min(34rem,75vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
    >
      <div className="flex items-center gap-3 bg-[#0F2C59] px-4 py-3 text-white">
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold leading-tight">Asistente de ayuda</p>
          <p className="text-[11.5px] text-blue-100">Respuestas preparadas · no guardamos lo que escribís</p>
        </div>
        <button type="button" aria-label="Cerrar asistente" onClick={onClose} className="rounded-md p-1.5 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={listRef} role="log" aria-live="polite" aria-label="Conversación" className="relative flex-1 space-y-3 overflow-y-auto bg-white p-3">
        {messages.map((message, index) => (
          <div key={message.id} ref={index === messages.length - 1 ? lastRef : undefined}>
            <Bubble message={message} onNavigate={onClose} />
          </div>
        ))}
        <QuickReplies
          chips={chips}
          faqs={chipFaqs}
          onTopic={(id) => setChips({ mode: "topic", id })}
          onQuestion={askFaq}
          onAllTopics={() => setChips({ mode: "topics" })}
        />
      </div>
      <form onSubmit={submit} className="border-t border-neutral-100 bg-neutral-50 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <label htmlFor="support-chat-input" className="sr-only">Escribí tu pregunta</label>
          <input
            id="support-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_LENGTH}
            autoComplete="off"
            placeholder="Escribí tu duda…"
            className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[13.5px] outline-none focus:border-[#0F2C59]"
          />
          <button
            type="submit"
            aria-label="Enviar pregunta"
            disabled={!draft.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D63031] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10.5px] text-neutral-400">No escribas contraseñas ni datos personales.</p>
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
