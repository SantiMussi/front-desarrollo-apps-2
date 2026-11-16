export const normalizeText = (text) =>
  String(text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Todas las claves y valores van SIN tildes (ya normalizados)
export const SYNONYMS = {
    // ─── Calles, veredas e infraestructura urbana ──────────────────
    bache: ["pozo", "hoyo", "asfalto", "calzada", "crater", "calle", "ruta", "hundimiento", "baches", "pozos", "hueco", "pavimento", "deteriorada"],
    vereda: ["baldosa", "pavimento", "cordon", "peatonal", "acera", "rampa", "cordon cuneta", "levantada", "rota", "veredas", "baldosas"],
    desague: ["zanja", "cloaca", "inundacion", "alcantarilla", "boca de tormenta", "sumidero", "tapado", "agua", "inundado", "desagues"],
    edificio: ["municipalidad", "cgp", "delegacion", "centro comunal", "edificios municipales"],

    // ─── Alumbrado y equipamiento urbano ─────────────────────────
    alumbrado: ["luz", "foco", "lampara", "iluminacion", "luminaria", "farol", "apagada", "poste", "columna", "led", "farola", "oscuridad", "quemada"],
    mobiliario: ["banco", "cesto", "refugio", "garita", "parada", "equipamiento", "juego", "calesita"],
    espacio: ["parque", "plaza", "monumento", "fuente", "espacio publico", "espacios publicos"],

    // ─── Limpieza, residuos y servicios urbanos ──────────────────
    residuo: ["basura", "mugre", "desecho", "bolsa", "limpieza", "desperdicio", "desechos", "residuos"],
    voluminoso: ["escombro", "mueble", "rama", "chatarra", "electrodomestico", "heladera", "colchon", "restos"],
    contenedor: ["tacho", "basurero", "campana", "reciclaje", "tacho de basura", "campana de vidrio", "contenedores", "tachos", "volquete"],
    recoleccion: ["camion", "basural", "microbasural", "no pasaron", "no paso", "recolector", "barrer", "barrido", "basurero", "camion de basura"],
    reciclaje: ["carton", "plastico", "vidrio", "papel", "ecopunto", "punto verde", "recuperar", "separacion", "reciclar"],

    // ─── Arbolado, plazas y espacios verdes ──────────────────────
    arbol: ["poda", "tronco", "raiz", "rama", "planta", "arbolado", "caida", "arbol caido", "riesgo caida", "copa", "follaje", "raices", "arboles", "podar"],
    plaza: ["parque", "pasto", "cesped", "yuyo", "maleza", "jardineria", "espacio verde"],

    // ─── Ambiente y convivencia urbana ───────────────────────────
    ruido: ["musica", "grito", "sonido", "fiesta", "molestia", "volumen", "boliche", "ruidos", "ruidoso", "escandalo", "bardo", "quilombo", "molestar", "vecino ruidoso", "construccion", "ladrido", "perro"],
    contaminacion: ["humo", "olor", "agua servida", "quemar", "quema", "toxico", "derrame", "ambiental"],
    higiene: ["roedor", "rata", "mosquito", "dengue", "plaga", "fumigacion", "cucaracha", "infeccion", "sanidad", "descacharrado"],
    ocupacion: ["mesa", "silla", "obstaculo", "vehiculo", "abandono", "espacio publico", "mercaderia", "obstruccion", "vereda ocupada", "auto abandonado", "puesto ambulante", "venta ambulante"],

    // ─── Comercios, habilitaciones e inspecciones ────────────────
    comercio: ["negocio", "local", "tienda", "gastronomia", "restaurante", "bar", "kiosco", "almacen", "supermercado", "carniceria", "panaderia", "farmacia", "verduleria"],
    habilitacion: ["permiso", "permiso comercial", "uso de suelo", "normativa", "abrir local", "tramite"],
    inspeccion: ["bromatologia", "control", "verificar", "sanidad", "alimentos", "inspecciones", "inspector"],
    clausura: ["clausurado", "faja", "multa", "infraccion", "intimacion", "levantar clausura"],
    denuncia: ["queja", "reclamo", "contravencion", "ilegal", "clandestino", "irregular", "sobreprecio", "horario"],

    // ─── Tránsito y seguridad vial ───────────────────────────────
    semaforo: ["cruce", "transito", "rojo", "verde", "amarillo", "intermitente", "desincronizado", "semaforos", "luz"],
    senal: ["cartel", "letrero", "chapa", "indicador", "senalizacion", "pare", "velocidad maxima", "sentido unico", "senal de transito", "carteleria", "senaletica", "pintura", "senda peatonal", "flecha", "mano"],
    seguridad: ["loma de burro", "reductor", "espejo", "ciclovia", "bicisenda", "vial"],
    estacionamiento: ["estacionar", "parquimetro", "medido", "lugar", "auto", "multa estacionamiento", "garage", "entrada", "transito", "transporte", "trafico", "movilidad", "circular"],
    corte: ["piquete", "desvio", "obra", "manifestacion", "calle cortada"],
    incidente: ["choque", "accidente", "siniestro", "atropello"],

    // ─── Infracciones y vehículos retenidos ──────────────────────
    infraccion: ["multa", "fotomulta", "acta", "ticket", "descargo", "juez", "juzgado", "controlador", "pagofacil", "infracciones"],
    vehiculo: ["corralon", "grua", "secuestro", "auto llevado", "moto", "remolque", "retenido", "deposito"],

    // ─── Tasas, tributos y pagos municipales ─────────────────────
    boleta: ["abl", "patente", "impuesto", "recibo", "factura", "tgi", "inmobiliario", "tasa", "tributo", "liquidacion"],
    pago: ["pagar", "abonar", "vencimiento", "tarjeta", "rapipago", "pagos"],
    deuda: ["moratoria", "deber", "atraso", "cuota", "deudas"],
    plan: ["financiacion", "cuotas", "convenio", "planes de pago"],
    exencion: ["jubilado", "pensionado", "discapacitado", "exento", "no pagar", "descuento", "exenciones"],

    // ─── Desarrollo social y asistencia comunitaria ──────────────
    asistencia: ["ayuda", "programa", "social", "alimento", "habitacional", "desarrollo", "subsidio", "beca", "comedor", "merendero", "calle", "situacion de calle", "emergencia social", "laboral", "empleo", "trabajo", "salud"],
    programa: ["plan", "plan social", "beneficio", "inscripcion", "anotarse", "garrafa", "vianda"],
    beneficio: ["boleto estudiantil", "tarifa social"],
    visita: ["asistente", "trabajador social", "censo", "encuesta"],
    urgencia: ["frio", "inundado", "incendio", "violencia", "refugio", "urgente"],

    // ─── Salud comunitaria y actividades municipales ─────────────
    turno: ["medico", "salita", "centro de salud", "dispensario", "hospital", "vacunacion", "castracion", "zoonosis", "antirrabica", "veterinaria", "salud"],
    campana: ["prevencion", "donacion", "campañas"],
    centro: ["polideportivo", "club", "taller", "cultura", "deporte", "natatorio", "pileta", "actividades"],

    // ─── Datos ciudadanos, organizaciones y acceso ───────────────
    datos: ["perfil", "nombre", "dni", "correo", "telefono", "actualizar", "cambiar", "personal", "ciudadano"],
    representacion: ["apoderado", "consorcio", "empresa", "ong", "club", "asociacion", "organizaciones"],
    cuenta: ["clave", "contraseña", "recuperar", "login", "entrar", "registrarse", "registro", "acceso"],

    // ─── Expedientes y trámites municipales ──────────────────────
    expediente: ["tramite", "numero", "mesa de entradas", "nota", "carta", "buscar", "estado", "seguimiento", "expedientes", "tramites"],
    documentacion: ["papel", "requisito", "fotocopia", "plano", "certificado", "libre deuda", "documentos"],
    derivacion: ["area", "oficina", "pase", "derivado", "derivaciones"],

    // ─── Atención y funcionamiento del portal ────────────────────
    portal: ["error", "pagina", "web", "no funciona", "caido", "lento", "bug", "problema", "uso", "funcionamiento"],
    ticket: ["reclamo", "numero de reclamo", "estado", "seguimiento de tickets", "solicitud"],
    notificacion: ["mail", "correo", "aviso", "mensaje", "notificaciones"],
    atencion: ["147", "telefono", "operador", "chat", "bot", "whatsapp", "municipal"]
};

// Amplía lo que escribió la persona con los sinónimos del grupo al que pertenece cada palabra.
export function expandSearchTerms(query) {
  const normalizedQuery = normalizeText(query);
  const terms = new Set([normalizedQuery]);
  Object.entries(SYNONYMS).forEach(([key, values]) => {
    if (normalizedQuery.includes(key) || values.some((v) => normalizedQuery.includes(v))) {
      terms.add(key);
      values.forEach((v) => terms.add(v));
    }
  });
  return Array.from(terms);
}

// Devuelve los tipos de reclamo que coinciden, en el orden del catálogo; `score` cuenta términos coincidentes.
export function findRequestTypeMatches(categories, query) {
  const terms = expandSearchTerms(query);
  const results = [];
  categories.forEach((category) => {
    category.subcategories.forEach((subcategory) => {
      subcategory.requestTypes.forEach((requestType) => {
        const text = normalizeText([requestType.name, requestType.description, subcategory.name, category.title].join(" "));
        const score = terms.filter((term) => term && text.includes(term)).length;
        if (score > 0) results.push({ category, subcategory, requestType, score });
      });
    });
  });
  return results;
}
