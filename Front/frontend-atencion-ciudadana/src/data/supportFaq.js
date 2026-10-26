export const SUPPORT_EMAIL = "atencion@ciudaduade.com.ar";

export const EMERGENCY_KEYWORDS = [
  "incendio", "fuego", "gas", "explosion", "emergencia", "accidente", "herido", "peligro de vida", "derrumbe", "cable cortado", "electrocut",
];

export const EMERGENCY_MESSAGE =
  "Si hay peligro para alguien, no esperes una respuesta por acá: llamá ya al 911 (emergencias), al 107 (ambulancia) o al 100 (bomberos). Este sitio no atiende urgencias.";

const HUMAN_NOTE = `Yo no puedo ver ni cambiar tu reclamo: lo atiende siempre una persona del equipo. Escribile desde «Mensajes» en el detalle del reclamo, o escribinos a ${SUPPORT_EMAIL} con su número.`;

export const SUPPORT_TOPICS = [
  { id: "claim", label: "Hacer un reclamo" },
  { id: "follow", label: "Seguir mi reclamo" },
  { id: "changes", label: "Cambios en mi reclamo" },
  { id: "help", label: "Ayuda y contacto" },
];

/**
 * Cada entrada: `keywords` son frases (sin tildes ni mayúsculas); se reconocen aunque cambie el orden
 * de las palabras o haya un error de tipeo. `action` es el botón opcional que
 * lleva a la pantalla indicada. `related` son ids de entradas para seguir la conversación.
 */
export const SUPPORT_FAQ = [
  // ─── Hacer un reclamo ────────────────────────────────────────────────
  {
    id: "new-claim", topic: "claim", question: "¿Cómo hago un reclamo?",
    keywords: ["hacer un reclamo", "hago un reclamo", "crear reclamo", "nuevo reclamo", "iniciar reclamo", "quiero hacer un reclamo", "quiero denunciar", "cargar reclamo", "enviar reclamo", "presentar un reclamo", "hacer una denuncia"],
    answer: "Entrá a «Hacer un reclamo», elegí el tema que más se parezca a tu problema y completá los datos. Si me contás qué pasa con tus palabras, también te sugiero el tema.",
    action: { label: "Hacer un reclamo", to: "/portal-ayuda" },
    related: ["what-report", "location", "photos"],
  },
  {
    id: "what-report", topic: "claim", question: "¿Qué puedo reclamar?",
    keywords: ["que puedo reclamar", "que se puede reclamar", "que puedo reportar", "que tipos de reclamo", "temas disponibles", "que temas hay", "para que sirve este sitio", "para que sirve la pagina"],
    answer: "Podés cargar reclamos, solicitudes, preguntas y sugerencias sobre servicios de la ciudad, como alumbrado, calles y veredas, limpieza, espacios verdes o tránsito. En «Hacer un reclamo» ves todos los temas disponibles.",
    action: { label: "Ver los temas", to: "/portal-ayuda" },
    related: ["ticket-types", "topic-not-found", "other-procedures"],
  },
  {
    id: "ticket-types", topic: "claim", question: "¿Qué diferencia hay entre reclamo, solicitud, pregunta y sugerencia?",
    keywords: ["diferencia entre reclamo", "reclamo y solicitud", "tipos de ticket", "que es una sugerencia", "que es una solicitud", "que es una pregunta", "reclamo o sugerencia", "reclamo o consulta"],
    answer: "Reclamo: algo que no funciona o está mal. Solicitud: pedir un servicio. Pregunta: una consulta. Sugerencia: una idea para mejorar. Al elegir el tema, el sitio ya te marca de qué tipo es.",
    related: ["new-claim", "what-report"],
  },
  {
    id: "topic-not-found", topic: "claim", question: "No encuentro mi tema",
    keywords: ["no encuentro mi tema", "no encuentro la categoria", "no esta mi problema", "no aparece mi problema", "otro tema", "no se que elegir", "no se cual elegir", "no encuentro lo que busco", "tema no listado"],
    answer: "Escribime con tus palabras qué pasa (por ejemplo «luz apagada» o «bache») y te sugiero el tema. Si ninguno encaja, usá «Otros» y mandá una consulta general.",
    action: { label: "Consulta general", to: "/portal-ayuda?category=otro&subcategory=otro-general&requestType=OTRO_CONSULTA_GENERAL" },
    related: ["what-report", "new-claim"],
  },
  {
    id: "location", topic: "claim", question: "¿Cómo indico la ubicación?",
    keywords: ["indicar la ubicacion", "poner la ubicacion", "ubicacion", "direccion", "mapa", "barrio", "calle y altura", "donde ocurrio", "punto en el mapa", "no carga el mapa", "no me sale el mapa"],
    answer: "En el formulario podés escribir la dirección, elegir el barrio o marcar un punto en el mapa. Si el mapa no carga, seguí con la dirección escrita. Cuanto más precisa sea, más rápido lo encuentran.",
    related: ["photos", "new-claim"],
  },
  {
    id: "photos", topic: "claim", question: "¿Puedo adjuntar fotos o archivos?",
    keywords: ["adjuntar", "subir fotos", "subir una foto", "foto", "fotos", "imagen", "archivo", "archivos", "pdf", "tamano del archivo", "peso maximo", "formato de archivo"],
    answer: "Sí, hasta 5 archivos por vez, de hasta 10 MB cada uno y 50 MB en total. Se aceptan fotos (JPEG, PNG, WebP, HEIC, HEIF) y PDF.",
    related: ["form-errors", "add-info"],
  },
  {
    id: "anonymous", topic: "claim", question: "¿Puedo hacer un reclamo anónimo?",
    keywords: ["anonimo", "reclamo anonimo", "puedo hacer un reclamo anonimo", "forma anonima", "sin dar mis datos", "sin dar mi nombre", "no quiero dar mi nombre", "mantener mi anonimato"],
    answer: "Sí. Si elegís la opción anónima, al enviar el reclamo te damos un código y una contraseña propios de ese reclamo. Guardalos: son la única forma de seguirlo.",
    action: { label: "Hacer un reclamo", to: "/portal-ayuda" },
    related: ["contact-channel", "lost-code", "track"],
  },
  {
    id: "contact-channel", topic: "claim", question: "¿Para qué piden un canal de contacto?",
    keywords: ["canal de contacto", "dejar mi telefono", "dejar mi mail", "dejar mi email", "para que piden mi mail", "para que piden mi telefono", "es obligatorio el telefono"],
    answer: "En los reclamos anónimos es opcional: es un email o teléfono para que el equipo pueda contactarte si necesita algo. Si no lo dejás, igual podés seguir tu reclamo con el código y la contraseña.",
    related: ["anonymous", "privacy"],
  },
  {
    id: "form-errors", topic: "claim", question: "El formulario no me deja enviar",
    keywords: ["no me deja enviar", "no puedo enviar", "no deja enviar", "campos obligatorios", "error al enviar", "falta completar", "boton enviar", "no se envia", "no puedo mandar"],
    answer: "Revisá los campos marcados en rojo: los obligatorios tienen que estar completos, el email o teléfono debe ser válido y los archivos no pueden pasar los límites. Si todo está bien y sigue fallando, escribinos contando qué mensaje ves.",
    related: ["photos", "technical", "contact"],
  },
  {
    id: "draft-lost", topic: "claim", question: "Salí del formulario y perdí lo que escribí",
    keywords: ["perdi lo que escribi", "se borro lo que escribi", "se borra el formulario", "volver a empezar", "salir del formulario", "perdi el formulario"],
    answer: "Si salís del formulario sin enviarlo, lo cargado se pierde (el sitio te avisa antes de salir). Conviene completarlo de una sola vez.",
    related: ["new-claim"],
  },

  // ─── Seguir mi reclamo ───────────────────────────────────────────────
  {
    id: "track", topic: "follow", question: "¿Cómo sigo mi reclamo?",
    keywords: ["seguir mi reclamo", "sigo mi reclamo", "seguimiento", "estado de mi reclamo", "como va mi reclamo", "consultar reclamo", "codigo de seguimiento", "donde veo mi reclamo", "ver mi reclamo", "como veo el estado"],
    answer: "Entrá a «Seguimiento» y poné el código y la contraseña que te dimos al enviar tu reclamo, o mirá la lista en «Mis reclamos». Ahí ves en qué paso está y los mensajes del equipo.",
    action: { label: "Ir a seguimiento", to: "/seguimiento" },
    related: ["statuses", "lost-code", "times"],
  },
  {
    id: "my-claims", topic: "follow", question: "¿Dónde veo todos mis reclamos?",
    keywords: ["mis reclamos", "todos mis reclamos", "donde veo todos mis reclamos", "historial de reclamos", "reclamos anteriores", "lista de reclamos", "mis tickets"],
    answer: "En «Mis reclamos» ves la lista de tus reclamos y podés entrar al detalle de cada uno: estado, mensajes del equipo y lo que necesiten de vos.",
    action: { label: "Ir a Mis reclamos", to: "/mis-reclamos" },
    related: ["track", "statuses"],
  },
  {
    id: "lost-code", topic: "follow", question: "Perdí el código o la contraseña de mi reclamo",
    keywords: ["perdi mi codigo", "perdi el codigo", "olvide el codigo", "no tengo el codigo", "no me acuerdo el codigo", "perdi la contrasena del reclamo", "olvide la contrasena del reclamo", "recuperar codigo", "no recuerdo el codigo"],
    answer: "Desde esta página no hay forma de recuperar el código ni la contraseña de un reclamo, por eso conviene guardarlos al enviarlo. Si no los encontrás, escribinos con los datos que recuerdes y te ayudamos.",
    related: ["contact", "anonymous"],
  },
  {
    id: "statuses", topic: "follow", question: "¿Qué significa cada estado?",
    keywords: ["que significa cada estado", "que significa el estado", "significado de los estados", "estados del reclamo", "que quiere decir derivado", "que es en gestion", "que es en revision", "que es registrado", "que significa derivado", "que significa pendiente"],
    answer: "Registrado: lo recibimos. En revisión: un agente lo analiza. Derivado: lo tiene el área responsable. En gestión: ya están trabajando. Pendiente de información: necesitamos un dato tuyo. Resuelto: terminaron y esperan tu confirmación. Cerrado: finalizó.",
    related: ["pending-info", "confirm-resolution", "times"],
  },
  {
    id: "times", topic: "follow", question: "¿Cuánto tarda en resolverse?",
    keywords: ["cuanto tarda", "cuando lo resuelven", "cuanto demora", "plazo de resolucion", "tiempo de respuesta", "cuando me responden", "hace dias que espero", "tardan mucho", "demora en resolver"],
    answer: "Depende del tipo de problema y del área que lo atiende, y desde acá no puedo asegurarte una fecha. En «Seguimiento» ves en qué paso está. Si pasó mucho tiempo sin cambios, escribile al equipo desde «Mensajes» o escribinos con el número del reclamo.",
    related: ["messages", "statuses"],
  },
  {
    id: "messages", topic: "follow", question: "¿Puedo escribirle al equipo?",
    keywords: ["escribirle al equipo", "mandar un mensaje", "enviar un mensaje", "hablar con el agente", "chat con el agente", "agregar un comentario", "mensaje al equipo", "comunicarme con el equipo", "escribirle al agente"],
    answer: "Sí. En el detalle del reclamo hay una sección «Mensajes» para conversar con el equipo mientras el reclamo está abierto. Podés editar o borrar tus propios mensajes.",
    related: ["add-info", "times"],
  },
  {
    id: "add-info", topic: "follow", question: "Quiero agregar información o fotos a mi reclamo",
    keywords: ["agregar fotos al reclamo", "agregar informacion", "me olvide de contar", "sumar una foto", "adjuntar despues", "agregar un dato", "agregar un adjunto", "quiero agregar algo", "completar mi reclamo"],
    answer: "Escribí un mensaje en el detalle del reclamo y, si está habilitado, adjuntá ahí los archivos. Lo que enviaste en el formulario no se modifica.",
    related: ["messages", "photos"],
  },
  {
    id: "pending-info", topic: "follow", question: "Me pidieron más información",
    keywords: ["piden informacion", "pidieron informacion", "pedido de informacion", "mas informacion", "que me piden", "responder pedido", "falta un dato", "necesitan un dato", "pendiente de informacion"],
    answer: "Entrá al detalle de tu reclamo: arriba verás un aviso y más abajo el pedido. Respondé ahí (podés adjuntar fotos) y el reclamo sigue su curso. Mientras no respondas, queda en pausa.",
    action: { label: "Ir a Mis reclamos", to: "/mis-reclamos" },
    related: ["photos", "statuses"],
  },
  {
    id: "notifications", topic: "follow", question: "¿Me avisan cuando cambia mi reclamo?",
    keywords: ["me avisan", "me avisan cuando cambia mi reclamo", "me van a avisar", "notificaciones", "me llega un mail", "me llega un aviso", "enterarme de los cambios", "avisos del reclamo"],
    answer: "El estado siempre lo ves actualizado en «Seguimiento» o «Mis reclamos». Si dejaste un canal de contacto, el equipo puede usarlo cuando necesite algo de tu parte.",
    related: ["track", "contact-channel"],
  },
  {
    id: "other-procedures", topic: "follow", question: "¿Puedo hacer otros trámites (impuestos, licencias, multas)?",
    keywords: ["pagar abl", "pagar patente", "impuestos", "licencia de conducir", "carnet", "multa", "boleta", "pagar una multa", "tramite", "otros tramites", "pagar la tasa"],
    answer: "Este sitio es para reclamos, solicitudes, consultas y sugerencias sobre servicios de la ciudad. Para trámites como impuestos, licencias o multas, consultá los canales oficiales del municipio.",
    related: ["what-report", "contact"],
  },

  // ─── Cambios en mi reclamo ───────────────────────────────────────────
  {
    id: "cancel", topic: "changes", question: "¿Puedo cancelar mi reclamo?",
    keywords: ["cancelar", "puedo cancelar mi reclamo", "cancelar mi reclamo", "anular", "dar de baja", "ya no lo necesito", "retirar el reclamo", "quiero cancelar"],
    answer: "Podés cancelarlo desde el detalle mientras esté en estado «Registrado». Si ya está en revisión o más avanzado, escribile al equipo desde «Mensajes» y lo ven.",
    related: ["cancel-request", "edit-ticket"],
  },
  {
    id: "cancel-request", topic: "changes", question: "Mi cancelación quedó pendiente de revisión",
    keywords: ["solicitud de cancelacion", "cancelacion pendiente", "pendiente de revision", "no se cancelo", "sigue activo despues de cancelar"],
    answer: "Cuando hay otros reclamos vinculados al tuyo (por ejemplo duplicados), la cancelación no es inmediata: se envía como solicitud y la revisa el equipo. Mientras esté pendiente, el reclamo sigue activo.",
    related: ["duplicate", "cancel"],
  },
  {
    id: "reopen", topic: "changes", question: "Me dijeron que está resuelto pero no es así",
    keywords: ["reabrir", "no esta resuelto", "no se soluciono", "sigue igual", "sigue el problema", "no lo arreglaron", "no lo resolvieron", "pero no es asi", "volvio a pasar", "no quedo resuelto"],
    answer: "Cuando figura como «Resuelto» podés elegir «Reabrir ticket» en el detalle y contarnos qué falta. Si ya lo confirmaste, el reclamo se cierra y conviene hacer uno nuevo mencionando el anterior.",
    action: { label: "Ir a Mis reclamos", to: "/mis-reclamos" },
    related: ["confirm-resolution", "messages"],
  },
  {
    id: "confirm-resolution", topic: "changes", question: "¿Cómo confirmo que se resolvió?",
    keywords: ["confirmar solucion", "confirmar la resolucion", "dar por resuelto", "quedo resuelto", "esta bien resuelto", "confirmar que se resolvio", "confirmar la solucion"],
    answer: "Cuando el reclamo figura como «Resuelto», en el detalle aparece «Confirmar solución». Si no respondés, puede cerrarse solo cuando pase el plazo indicado.",
    related: ["reopen", "survey"],
  },
  {
    id: "edit-ticket", topic: "changes", question: "¿Puedo modificar un reclamo ya enviado?",
    keywords: ["modificar mi reclamo", "modificar un reclamo enviado", "editar mi reclamo", "cambiar mi reclamo", "corregir mi reclamo", "cambiar la direccion", "cambiar la ubicacion", "cambiar los datos", "me equivoque al cargar", "error en mi reclamo"],
    answer: "Lo que enviaste no se edita, pero podés avisar el cambio escribiendo en «Mensajes» del detalle. Si el equipo necesita ajustar el tema o la ubicación, te lo va a pedir ahí mismo.",
    related: ["messages", "reclassification", "cancel"],
  },
  {
    id: "reclassification", topic: "changes", question: "Me piden confirmar el tipo o la ubicación",
    keywords: ["cambiar el tipo", "confirmar la ubicacion", "reclasificar", "reclasificacion", "me piden la ubicacion", "cambio de categoria", "propuesta de cambio", "otro tipo de reclamo"],
    answer: "A veces el equipo propone ajustar el tipo de reclamo. En el detalle ves un aviso con lo que necesitan: respondé ahí para que el reclamo siga su curso.",
    related: ["pending-info", "edit-ticket"],
  },
  {
    id: "duplicate", topic: "changes", question: "Mi reclamo figura como duplicado",
    keywords: ["duplicado", "repetido", "ya estaba reportado", "otro vecino", "ya lo habian reportado", "reclamo duplicado"],
    answer: "Significa que otro vecino ya había informado lo mismo. Tu reclamo se sigue junto con ese, así que no tenés que hacer nada más.",
    related: ["cancel-request", "statuses"],
  },
  {
    id: "survey", topic: "changes", question: "¿Para qué es la encuesta de satisfacción?",
    keywords: ["encuesta", "calificar", "calificacion", "valorar", "puntuar", "estrellas", "dejar mi opinion", "opinar sobre la atencion"],
    answer: "Cuando un reclamo se cierra podés calificar la atención de 1 a 5 y dejar un comentario. Es opcional y ayuda a mejorar el servicio.",
    related: ["confirm-resolution"],
  },

  // ─── Datos y privacidad ──────────────────────────────────────────────
  {
    id: "privacy", topic: "help", question: "¿Qué pasa con mis datos?",
    keywords: ["mis datos", "privacidad", "datos personales", "es seguro", "quien ve mi reclamo", "confidencial", "uso de mis datos", "protegen mis datos"],
    answer: "Usamos los datos que cargás para gestionar tu reclamo. En un reclamo anónimo no hace falta que des datos personales. No hace falta compartir contraseñas ni datos bancarios en ningún lugar del sitio.",
    related: ["contact-channel", "delete-data"],
  },
  {
    id: "delete-data", topic: "help", question: "Quiero borrar mi reclamo o mis datos",
    keywords: ["borrar mi reclamo", "eliminar mi reclamo", "borrar mis datos", "eliminar mis datos", "derecho al olvido"],
    answer: "Desde el sitio no se puede borrar un reclamo. Si está en «Registrado» podés cancelarlo. Para pedir la baja de tus datos, escribinos y lo gestiona una persona del equipo.",
    related: ["cancel", "contact"],
  },

  // ─── Ayuda y contacto ────────────────────────────────────────────────
  {
    id: "contact", topic: "help", question: "¿Cómo me comunico con ustedes?",
    keywords: ["hablar con ustedes", "me comunico con ustedes", "comunicarme con ustedes", "contacto", "contactar", "telefono de contacto", "mail de contacto", "correo de contacto", "donde escribo", "como los contacto", "escribirles"],
    answer: `Escribinos a ${SUPPORT_EMAIL} contando qué pasó. Si ya tenés un reclamo, incluí su número así lo encontramos más rápido.`,
    related: ["human", "hours"],
  },
  {
    id: "human", topic: "help", question: "Quiero que me atienda una persona",
    keywords: ["hablar con una persona", "que me atienda una persona", "que me atienda alguien", "atencion humana", "quiero un agente", "hablar con alguien", "persona real", "hablar con un humano", "ayuda humana", "un empleado", "hablar con un operador", "quiero hablar con un agente"],
    answer: `Este asistente solo responde dudas sobre el sitio. ${HUMAN_NOTE}`,
    related: ["contact", "times"],
  },
  {
    id: "complaint-delay", topic: "help", question: "Nadie me responde",
    keywords: ["nadie me responde", "nadie me contesta", "no me responden", "apurar mi reclamo", "mi reclamo es urgente", "por que no responden", "mal atendido", "queja por la atencion", "queja del agente", "ya paso mucho tiempo", "me ignoran"],
    answer: `Entiendo la molestia. ${HUMAN_NOTE}`,
    related: ["times", "human"],
  },
  {
    id: "technical", topic: "help", question: "El sitio no funciona bien",
    keywords: ["no funciona la pagina", "la pagina no anda", "no carga la pagina", "se traba", "error en la pagina", "pagina caida", "se cuelga", "pantalla en blanco", "no abre la pagina", "el sitio no funciona", "no anda el sitio"],
    answer: "Probá recargar la página y revisar tu conexión; si sigue, probá con otro navegador o desde el celular. Si el problema continúa, escribinos con una captura o contando qué estabas haciendo.",
    related: ["contact", "form-errors"],
  },
  {
    id: "accessibility", topic: "help", question: "No veo bien: ¿puedo agrandar la letra?",
    keywords: ["letra chica", "no veo bien", "letra grande", "agrandar la letra", "alto contraste", "accesibilidad", "no puedo leer", "texto mas grande", "me cuesta leer", "ver mejor"],
    answer: "Tocá el botón de accesibilidad (abajo a la izquierda) para agrandar la letra o activar el alto contraste. La elección se recuerda en este dispositivo.",
    related: ["what-can-you-do"],
  },
  {
    id: "hours", topic: "help", question: "¿Hasta qué hora atienden?",
    keywords: ["horario", "hasta que hora", "dias de atencion", "atienden los fines de semana", "atienden las 24 horas", "esta abierto", "horario de atencion"],
    answer: "Podés cargar y seguir reclamos a cualquier hora, todos los días. El equipo los atiende en su horario de trabajo, así que la respuesta puede no ser inmediata.",
    related: ["times", "contact"],
  },
  {
    id: "emergency", topic: "help", question: "Es una emergencia",
    keywords: ["es una emergencia", "es urgente", "urgencia", "ayuda urgente", "peligro de vida", "necesito ayuda urgente"],
    answer: EMERGENCY_MESSAGE,
    related: ["new-claim"],
  },
  {
    id: "what-can-you-do", topic: "help", question: "¿Qué podés hacer vos?",
    keywords: ["que podes hacer", "en que me ayudas", "que sabes hacer", "para que servis", "ayuda", "menu", "opciones", "que haces", "como funciona este chat"],
    answer: "Puedo explicarte cómo usar el sitio: hacer y seguir reclamos, entender los estados y resolver dudas comunes. No puedo ver ni cambiar tu reclamo ni decidir nada sobre él: eso lo hace siempre una persona del equipo.",
    related: ["human", "new-claim"],
  },

  // ─── Charla básica (no aparece en los menús) ─────────────────────────
  {
    id: "greeting", smalltalk: true,
    keywords: ["hola", "buen dia", "buenas", "buenas tardes", "buenas noches", "que tal", "como estas"],
    answer: "¡Hola! ¿En qué te puedo ayudar? Escribime tu duda con tus palabras o elegí un tema.",
  },
  {
    id: "thanks", smalltalk: true,
    keywords: ["gracias", "muchas gracias", "genial", "perfecto", "excelente", "joya", "gracias por tu ayuda"],
    answer: "¡De nada! Si necesitás algo más, acá estoy.",
  },
  {
    id: "bye", smalltalk: true,
    keywords: ["chau", "adios", "hasta luego", "nos vemos", "hasta pronto"],
    answer: "¡Hasta luego! Si necesitás algo más, acá estoy.",
  },
  {
    id: "who-are-you", smalltalk: true,
    keywords: ["sos una persona", "sos un robot", "sos humano", "sos una ia", "sos inteligencia artificial", "quien sos", "como te llamas", "eres un robot", "eres humano"],
    answer: "Soy el asistente de ayuda del sitio: un programa con respuestas preparadas, no una persona ni una inteligencia artificial. Los reclamos los atiende el equipo.",
    related: ["what-can-you-do", "human"],
  },
  {
    id: "not-helpful", smalltalk: true,
    keywords: ["no me sirve", "no entendi", "no entiendo", "no me ayudas", "no me ayudaste", "no sirve", "inutil", "no es lo que pregunte", "esa no es mi duda"],
    answer: `Perdón por no haber sido de ayuda. Probá con otras palabras o elegí un tema. Si preferís, escribile a una persona: ${SUPPORT_EMAIL}.`,
    related: ["human", "what-can-you-do"],
  },
];

export const faqById = (id) => SUPPORT_FAQ.find((faq) => faq.id === id);
export const faqsForTopic = (topic) => SUPPORT_FAQ.filter((faq) => faq.topic === topic);

export const TICKET_SCOPE_ANSWER = {
  text: `Veo que mencionás un reclamo puntual, pero no puedo consultarlo ni modificarlo desde acá. ${HUMAN_NOTE}`,
  action: { label: "Ir a seguimiento", to: "/seguimiento" },
};

export const PRIVACY_NOTE = "Por tu seguridad, tapé datos personales de tu mensaje. No los escribas acá: no hacen falta para que te ayude.";
