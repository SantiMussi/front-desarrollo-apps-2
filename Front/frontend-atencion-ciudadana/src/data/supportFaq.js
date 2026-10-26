export const SUPPORT_EMAIL = "atencion@ciudaduade.com.ar";

export const EMERGENCY_KEYWORDS = [
  "incendio", "fuego", "gas", "explosion", "emergencia", "accidente", "herido", "peligro de vida", "derrumbe", "cable cortado", "electrocut",
];

export const EMERGENCY_MESSAGE =
  "Si hay peligro para alguien, no esperes una respuesta por acá: llamá ya al 911 (emergencias), al 107 (ambulancia) o al 100 (bomberos). Este sitio no atiende urgencias.";

// Las palabras clave van sin tildes ni mayúsculas.
export const SUPPORT_FAQ = [
  {
    id: "new-claim",
    question: "¿Cómo hago un reclamo?",
    keywords: ["hacer un reclamo", "crear reclamo", "nuevo reclamo", "hago un reclamo", "iniciar reclamo", "como reclamo", "quiero reclamar", "denunciar", "cargar reclamo", "enviar reclamo"],
    answer: "Entrá a «Hacer un reclamo», elegí el tema que más se parezca a tu problema y completá los datos. Podés hacerlo con tu cuenta o sin cuenta.",
    action: { label: "Hacer un reclamo", to: "/portal-ayuda" },
  },
  {
    id: "track",
    question: "¿Cómo sigo mi reclamo?",
    keywords: ["seguir", "seguimiento", "estado de mi reclamo", "como va mi reclamo", "sigo mi reclamo", "consultar reclamo", "codigo de seguimiento", "donde veo mi reclamo", "ver mi reclamo"],
    answer: "Si lo hiciste con tu cuenta, lo ves en «Mis reclamos». Si lo hiciste sin cuenta, entrá a «Seguimiento» y poné el código y la contraseña que te dimos al enviarlo.",
    action: { label: "Ir a seguimiento", to: "/seguimiento" },
  },
  {
    id: "lost-code",
    question: "Perdí mi código o mi contraseña del reclamo",
    keywords: ["perdi", "olvide", "no me acuerdo", "no recuerdo", "extravie", "recuperar codigo", "recuperar contrasena", "olvide la contrasena", "no tengo el codigo"],
    answer: "Desde esta página no hay forma de recuperar el código ni la contraseña de un reclamo sin cuenta, por eso conviene guardarlos al enviarlo. Si lo hiciste con tu cuenta, no los necesitás: entrá a «Mis reclamos». Si aun así no lo encontrás, escribinos y te ayudamos.",
    action: { label: "Ir a Mis reclamos", to: "/mis-reclamos" },
  },
  {
    id: "statuses",
    question: "¿Qué significa cada estado?",
    keywords: ["estado", "estados", "significa", "derivado", "en gestion", "en revision", "registrado", "pendiente de informacion", "cerrado", "resuelto"],
    answer: "Registrado: lo recibimos. En revisión: un agente lo analiza. Derivado: lo tiene el área responsable. En gestión: ya están trabajando. Pendiente de información: necesitamos un dato tuyo. Resuelto: terminaron y esperan tu confirmación. Cerrado: finalizó.",
  },
  {
    id: "pending-info",
    question: "Me pidieron más información",
    keywords: ["piden informacion", "pidieron informacion", "pedido de informacion", "mas informacion", "que me piden", "responder pedido", "falta un dato"],
    answer: "Entrá al detalle de tu reclamo: arriba verás un aviso y más abajo el pedido. Respondé ahí, podés adjuntar fotos, y el reclamo sigue su curso.",
    action: { label: "Ir a Mis reclamos", to: "/mis-reclamos" },
  },
  {
    id: "cancel",
    question: "¿Puedo cancelar mi reclamo?",
    keywords: ["cancelar", "anular", "dar de baja", "ya no lo necesito", "me equivoque", "retirar reclamo"],
    answer: "Podés cancelarlo desde el detalle mientras esté en estado «Registrado». Si ya está en revisión o más avanzado, escribinos y lo vemos.",
  },
  {
    id: "reopen",
    question: "Me dijeron que está resuelto pero no es así",
    keywords: ["reabrir", "no esta resuelto", "no se soluciono", "sigue igual", "sigue el problema", "no lo arreglaron", "no lo resolvieron", "pero no es asi", "volvio a pasar"],
    answer: "Cuando figura como «Resuelto» podés elegir «Reabrir» en el detalle del reclamo y contarnos qué falta. Si ya lo confirmaste como cerrado, hacé uno nuevo mencionando el anterior.",
    action: { label: "Ir a Mis reclamos", to: "/mis-reclamos" },
  },
  {
    id: "anonymous",
    question: "¿Puedo reclamar sin crear una cuenta?",
    keywords: ["sin cuenta", "sin crear una cuenta", "anonimo", "sin registrarme", "no quiero registrarme", "sin usuario", "sin datos"],
    answer: "Sí. Al enviar tu reclamo sin cuenta te damos un código y una contraseña propios de ese reclamo. Guardalos: son la única forma de seguirlo.",
    action: { label: "Hacer un reclamo", to: "/portal-ayuda" },
  },
  {
    id: "photos",
    question: "¿Puedo adjuntar fotos o archivos?",
    keywords: ["foto", "fotos", "imagen", "adjuntar", "archivo", "pdf", "subir", "peso", "tamano"],
    answer: "Sí, hasta 5 archivos por vez, de hasta 10 MB cada uno y 50 MB en total. Se aceptan fotos (JPEG, PNG, WebP, HEIC, HEIF) y PDF.",
  },
  {
    id: "duplicate",
    question: "Mi reclamo figura como duplicado",
    keywords: ["duplicado", "repetido", "ya estaba reportado", "otro vecino"],
    answer: "Significa que otro vecino ya había informado lo mismo. Tu reclamo se sigue junto con ese, así que no tenés que hacer nada más.",
  },
  {
    id: "contact",
    question: "Quiero hablar con una persona",
    keywords: ["hablar con", "persona", "contacto", "contactar", "telefono", "mail", "correo", "atencion", "ayuda humana", "operador", "no funciona", "error"],
    answer: `Escribinos a ${SUPPORT_EMAIL} contando qué pasó. Si ya tenés un reclamo, incluí su número así lo encontramos más rápido.`,
  },
];

export const QUICK_QUESTIONS = ["new-claim", "track", "statuses", "contact"];
