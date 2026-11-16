function requestType(code, name, ticketType, assignedArea, fieldKey = "descripcionDetallada", description = `${ticketType} referente a ${name[0].toLowerCase()}${name.slice(1)} - Área asignada: ${assignedArea}.`) {
  return {
    code, name, description, ticketType, assignedArea,
    specificFields: [{
      key: fieldKey,
      label: fieldKey === "test" ? "test" : "Descripción detallada",
      type: "textarea",
      placeholder: "Describa en detalle la situación o motivo...",
      required: true,
    }],
  };
}

function requestTypes(definitions) {
  return Object.entries(definitions).map(([code, values]) => requestType(code, ...values));
}

export const MOCK_CATEGORIES = [
  {
    id: "calles-veredas-e-infraestructura-urbana",
    title: "Calles, veredas e infraestructura urbana",
    description: "Hacé clic aquí para informar baches, calles o veredas dañadas, desagües tapados u otros problemas de infraestructura urbana.",
    iconName: "Construction",
    itemCount: 12,
    badgeText: null,
    subcategories: [
      {
        id: "calles-y-pavimento",
        name: "Calles y Pavimento",
        iconName: "Construction",
        requestTypes: requestTypes({
          INFORMAR_UN_BACHE: ["Informar un bache", "Reclamo", "Obras Públicas"],
          INFORMAR_UNA_CALLE_DETERIORADA: ["Informar una calle deteriorada", "Reclamo", "Obras Públicas"],
          SOLICITAR_REPARACION_DE_CALLE: ["Solicitar reparación de calle", "Solicitud", "Obras Públicas"],
          INFORMAR_UNA_OBRA_INCONCLUSA: ["Informar una obra inconclusa", "Reclamo", "Obras Públicas"],
        }),
      },
      {
        id: "veredas",
        name: "Veredas",
        iconName: "Footprints",
        requestTypes: requestTypes({
          INFORMAR_UNA_VEREDA_ROTA: ["Informar una vereda rota", "Reclamo", "Obras Públicas"],
          SOLICITAR_REPARACION_DE_VEREDA_MUNICIPAL: ["Solicitar reparación de vereda municipal", "Solicitud", "Obras Públicas"],
          INFORMAR_UNA_VEREDA_OBSTRUIDA: ["Informar una vereda obstruida", "Reclamo", "Obras Públicas"],
        }),
      },
      {
        id: "desagues",
        name: "Desagües",
        iconName: "Droplets",
        requestTypes: requestTypes({
          INFORMAR_UN_DESAGUE_TAPADO: ["Informar un desagüe tapado", "Reclamo", "Obras Públicas"],
          INFORMAR_ACUMULACION_DE_AGUA: ["Informar acumulación de agua", "Reclamo", "Obras Públicas"],
          SOLICITAR_LIMPIEZA_DE_DESAGUE: ["Solicitar limpieza de desagüe", "Solicitud", "Obras Públicas"],
        }),
      },
      {
        id: "edificios-municipales",
        name: "Edificios Municipales",
        iconName: "Building2",
        requestTypes: requestTypes({
          INFORMAR_DANOS_EN_UN_EDIFICIO_MUNICIPAL: ["Informar daños en un edificio municipal", "Reclamo", "Obras Públicas"],
          INFORMAR_PROBLEMAS_DE_ACCESIBILIDAD: ["Informar problemas de accesibilidad", "Reclamo", "Obras Públicas"],
        }),
      },
    ],
  },
  {
    id: "alumbrado-y-equipamiento-urbano",
    title: "Alumbrado y equipamiento urbano",
    description: "Hacé clic aquí para informar luminarias apagadas, columnas dañadas, cables expuestos o problemas con el mobiliario urbano.",
    iconName: "Lightbulb",
    itemCount: 8,
    badgeText: null,
    subcategories: [
      {
        id: "alumbrado-publico",
        name: "Alumbrado público",
        iconName: "Lamp",
        requestTypes: requestTypes({
          INFORMAR_UNA_LUMINARIA_APAGADA: ["Informar una luminaria apagada", "Reclamo", "Obras Públicas"],
          INFORMAR_UNA_LUMINARIA_INTERMITENTE: ["Informar una luminaria intermitente", "Reclamo", "Obras Públicas"],
          INFORMAR_UNA_COLUMNA_DANADA: ["Informar una columna dañada", "Reclamo", "Obras Públicas"],
          INFORMAR_UNA_CABLES_EXPUESTOS: ["Informar una cables expuestos", "Reclamo", "Obras Públicas"],
          SOLICITAR_NUEVA_ILUMINACION: ["Solicitar nueva iluminación", "Solicitud", "Obras Públicas"],
        }),
      },
      {
        id: "mobiliario-urbano",
        name: "Mobiliario urbano",
        iconName: "Armchair",
        requestTypes: requestTypes({
          INFORMAR_MOBILIARIO_DANADO: ["Informar mobiliario dañado", "Reclamo", "Obras Públicas"],
          SOLICITA_INSTALACION_DE_MOBILIARIO: ["Solicita instalación de mobiliario", "Solicitud", "Obras Públicas"],
        }),
      },
      {
        id: "espacios-publicos",
        name: "Espacios públicos",
        iconName: "MapPin",
        requestTypes: requestTypes({
          SUGERIR_MEJORAS_EN_UN_ESPACIO_PUBLICO: ["Sugerir mejoras en un espacio público", "Sugerencia", "Obras Públicas"],
        }),
      },
    ],
  },
  {
    id: "limpieza-residuos-y-servicios-urbanos",
    title: "Limpieza, residuos y servicios urbanos",
    description: "Hacé clic aquí para informar falta de recolección, contenedores desbordados, residuos acumulados o solicitar servicios de limpieza.",
    iconName: "Trash2",
    itemCount: 14,
    badgeText: null,
    subcategories: [
      {
        id: "recoleccion-domiciliaria",
        name: "Recolección domiciliaria",
        iconName: "Trash",
        requestTypes: requestTypes({
          INFORMAR_FALTA_DE_RECOLECCION: ["Informar falta de recolección", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_RECOLECCION_FUERA_DE_HORARIO: ["Informar recolección fuera de horario", "Reclamo", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "residuos-voluminosos",
        name: "Residuos voluminosos",
        iconName: "Truck",
        requestTypes: requestTypes({
          SOLICITAR_RETIRO_DE_RESIDUOS_VOLUMINOSOS: ["Solicitar retiro de residuos voluminosos", "Solicitud", "Ambiente y Servicios Urbanos", "test"],
          CONSULTAR_COMO_DISPONER_RESIDUOS_ESPECIALES: ["Consultar cómo disponer residuos especiales", "Consulta", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "contenedores",
        name: "Contenedores",
        iconName: "Trash2",
        requestTypes: requestTypes({
          INFORMAR_UN_CONTENEDOR_DESBORDADO: ["Informar un contenedor desbordado", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_UN_CONTENEDOR_DANADO: ["Informar un contenedor dañado", "Reclamo", "Ambiente y Servicios Urbanos"],
          SOLICITAR_LIMPIEZA_DE_UN_CONTENEDOR: ["Solicitar limpieza de un contenedor", "Solicitud", "Ambiente y Servicios Urbanos"],
          SOLICITAR_REUBICACION_DE_UN_CONTENEDOR: ["Solicitar reubicación de un contenedor", "Solicitud", "Ambiente y Servicios Urbanos"],
          SOLICITAR_UN_NUEVO_CONTENEDOR: ["Solicitar un nuevo contenedor", "Solicitud", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "limpieza-urbana",
        name: "Limpieza urbana",
        iconName: "Sparkles",
        requestTypes: requestTypes({
          INFORMAR_SUCIEDAD_EN_LA_VIA_PUBLICA: ["Informar suciedad en la vía pública", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_UN_MICROBASURAL: ["Informar un microbasural", "Reclamo", "Ambiente y Servicios Urbanos"],
          SOLICITAR_UN_OPERATIVO_DE_LIMPIEZA: ["Solicitar un operativo de limpieza", "Solicitud", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "reciclaje",
        name: "Reciclaje",
        iconName: "Recycle",
        requestTypes: requestTypes({
          CONSULTAR_PUNTOS_VERDES: ["Consultar puntos verdes", "Consulta", "Ambiente y Servicios Urbanos"],
          SUGERIR_UN_NUEVO_PUNTO_VERDE: ["Sugerir un nuevo punto verde", "Sugerencia", "Ambiente y Servicios Urbanos"],
        }),
      },
    ],
  },
  {
    id: "arbolado-plazas-y-espacios-verdes",
    title: "Arbolado, plazas y espacios verdes",
    description: "Hacé clic aquí para informar árboles o ramas peligrosas, solicitar poda o reportar problemas en plazas y parques.",
    iconName: "Trees",
    itemCount: 10,
    badgeText: null,
    subcategories: [
      {
        id: "arbolado-publico",
        name: "Arbolado público",
        iconName: "TreePine",
        requestTypes: requestTypes({
          INFORMAR_UN_ARBOL_CON_RIESGO_DE_CAIDA: ["Informar un árbol con riesgo de caída", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_UNA_RAMA_PELIGROSA: ["Informar una rama peligrosa", "Reclamo", "Ambiente y Servicios Urbanos"],
          SOLICITAR_PODA: ["Solicitar poda", "Solicitud", "Ambiente y Servicios Urbanos"],
          SOLICITAR_EXTRACCION_DE_UN_ARBOL: ["Solicitar extracción de un árbol", "Solicitud", "Ambiente y Servicios Urbanos"],
          SOLICITAR_PLANTACION_DE_UN_ARBOL: ["Solicitar plantación de un arbol", "Solicitud", "Ambiente y Servicios Urbanos"],
          DENUNCIAR_DANO_AL_ARBOLADO: ["Denunciar daño al arbolado", "Reclamo", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "plazas-y-parques",
        name: "Plazas y parques",
        iconName: "Trees",
        requestTypes: requestTypes({
          INFORMAR_FALTA_DE_MANTENIMIENTO: ["Informar falta de mantenimiento", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_JUEGOS_DANADOS: ["Informar juegos dañados", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_PROBLEMAS_DE_RIESGO: ["Informar problemas de riesgo", "Reclamo", "Ambiente y Servicios Urbanos"],
          SUGERIR_MEJORAS_PARA_UNA_PLAZA: ["Sugerir mejoras para una plaza", "Sugerencia", "Ambiente y Servicios Urbanos"],
        }),
      },
    ],
  },
  {
    id: "ambiente-y-convivencia-urbana",
    title: "Ambiente y convivencia urbana",
    description: "Hacé clic aquí para denunciar ruidos molestos, contaminación, vertidos, malos olores o situaciones que afecten la convivencia.",
    iconName: "ShieldAlert",
    itemCount: 8,
    badgeText: null,
    subcategories: [
      {
        id: "ruidos-molestos",
        name: "Ruidos molestos",
        iconName: "Volume2",
        requestTypes: requestTypes({
          DENUNCIAR_RUIDOS_DE_UN_COMERCIO: ["Denunciar ruidos de un comercio", "Reclamo", "Habilitaciones y Control Comercial"],
          DENUNCIAR_RUIDOS_EN_LA_VIA_PUBLICA: ["Denunciar ruidos en la vía pública", "Reclamo", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "contaminacion",
        name: "Contaminación",
        iconName: "Biohazard",
        requestTypes: requestTypes({
          DENUNCIAR_VERTIDO_DE_LIQUIDOS_O_RESIDUOS: ["Denunciar vertido de líquidos o residuos", "Reclamo", "Ambiente y Servicios Urbanos"],
          DENUNCIAR_HUMO_O_OLORES_MOLESTOS: ["Denunciar humo o olores molestos", "Reclamo", "Ambiente y Servicios Urbanos"],
          INFORMAR_PRESENCIA_DE_RESIDUOS_PELIGROSOS: ["Informar presencia de residuos peligrosos", "Reclamo", "Ambiente y Servicios Urbanos"],
        }),
      },
      {
        id: "higiene",
        name: "Higiene",
        iconName: "Sparkles",
        requestTypes: requestTypes({
          DENUNCIAR_CONDICIONES_INSALUBRE: ["Denunciar condiciones insalubre", "Reclamo", "Ambiente y Servicios Urbanos"],
          DENUNCIAR_FALTA_DE_HIGIENE_EN_UN_COMERCIO: ["Denunciar falta de higiene en un comercio", "Reclamo", "Habilitaciones y Control Comercial"],
        }),
      },
      {
        id: "ocupacion-del-espacio-publico",
        name: "Ocupación del espacio público",
        iconName: "MapPinOff",
        requestTypes: requestTypes({
          DENUNCIAR_OCUPACION_IRREGULAR_OKUPAS: ["Denunciar ocupación irregular (okupas)", "Reclamo", "Habilitaciones y Control Comercial"],
        }),
      },
    ],
  },
  {
    id: "comercios-habilitaciones-e-inspecciones",
    title: "Comercios, habilitaciones e inspecciones",
    description: "Hacé clic aquí para consultar habilitaciones, informar problemas con inspecciones o denunciar posibles irregularidades comerciales.",
    iconName: "Store",
    itemCount: 12,
    badgeText: null,
    subcategories: [
      {
        id: "habilitacion-comercial",
        name: "Habilitación comercial",
        iconName: "Store",
        requestTypes: requestTypes({
          CONSULTAR_REQUISITOS_DE_HABILITACION: ["Consultar requisitos de habilitación", "Consulta", "Habilitaciones y Control Comercial"],
          CONSULTAR_ESTADO_DE_UNA_HABILITACION: ["Consultar estado de una habilitación", "Consulta", "Habilitaciones y Control Comercial"],
          INFORMAR_UN_PROBLEMA_CON_LA_DOCUMENTACION: ["Informar un problema con la documentación", "Reclamo", "Habilitaciones y Control Comercial"],
          SOLICITAR_ORIENTACION_PARA_RENOVAR_UNA_HABILITACION: ["Solicitar orientación para renovar una habilitación", "Solicitud", "Habilitaciones y Control Comercial"],
        }),
      },
      {
        id: "inspecciones",
        name: "Inspecciones",
        iconName: "ClipboardCheck",
        requestTypes: requestTypes({
          CONSULTAR_UNA_INSPECCION_PROGRAMADA: ["Consultar una inspección programada", "Consulta", "Habilitaciones y Control Comercial"],
          SOLICITAR_REPROGRAMACION_DE_UNA_INSPECCION: ["Solicitar reprogramación de una inspección", "Solicitud", "Habilitaciones y Control Comercial"],
          RECLAMAR_POR_UNA_DEMORA_EN_LA_INSPECCION: ["Reclamar por una demora en la inspección", "Reclamo", "Habilitaciones y Control Comercial"],
        }),
      },
      {
        id: "denuncias-comerciales",
        name: "Denuncias comerciales",
        iconName: "AlertTriangle",
        requestTypes: requestTypes({
          DENUNCIAR_UN_COMERCIO_SIN_HABILITACION: ["Denunciar un comercio sin habilitación", "Reclamo", "Habilitaciones y Control Comercial"],
          DENUNCIAR_INCUMPLIMIENTOS_HORARIOS: ["Denunciar incumplimientos horarios", "Reclamo", "Habilitaciones y Control Comercial"],
          DENUNCIAR_ACTIVIDAD_NO_AUTORIZADA: ["Denunciar actividad no autorizada", "Reclamo", "Habilitaciones y Control Comercial"],
        }),
      },
      {
        id: "clausuras-e-intimaciones",
        name: "Clausuras e intimaciones",
        iconName: "Ban",
        requestTypes: requestTypes({
          CONSULTAR_UNA_INTIMACION_O_CLAUSURA: ["Consultar una intimación o clausura", "Consulta", "Habilitaciones y Control Comercial"],
          INFORMAR_UN_POSIBLE_INCUMPLIMIENTO_DE_CLAUSURA: ["Informar un posible incumplimiento de clausura", "Reclamo", "Habilitaciones y Control Comercial"],
        }),
      },
    ],
  },
  {
    id: "transito-y-seguridad-vial",
    title: "Tránsito y seguridad vial",
    description: "Hacé clic aquí para contactarnos por semáforos, señalización, estacionamiento, circulación o situaciones de riesgo vial.",
    iconName: "TrafficCone",
    itemCount: 14,
    badgeText: null,
    subcategories: [
      {
        id: "semaforos",
        name: "Semáforos",
        iconName: "TrafficCone",
        requestTypes: requestTypes({
          INFORMAR_UN_SEMAFORO_FUERA_DE_SERVICIO: ["Informar un semáforo fuera de servicio", "Reclamo", "Tránsito"],
          INFORMAR_UN_SEMAFORO_DESCOORDINADO: ["Informar un semáforo descoordinado", "Reclamo", "Tránsito"],
        }),
      },
      {
        id: "senalizacion",
        name: "Señalización",
        iconName: "SignpostBig",
        requestTypes: requestTypes({
          INFORMAR_UNA_SENAL_DANADA_O_FALTANTE: ["Informar una señal dañada o faltante", "Reclamo", "Tránsito"],
          SOLICITAR_NUEVA_SENALIZACION: ["Solicitar nueva señalización", "Solicitud", "Tránsito"],
          SUGERIR_CAMBIOS_DE_CIRCULACION: ["Sugerir cambios de circulación", "Sugerencia", "Tránsito"],
        }),
      },
      {
        id: "seguridad-vial",
        name: "Seguridad vial",
        iconName: "ShieldAlert",
        requestTypes: requestTypes({
          INFORMAR_UNA_SITUACION_VIAL: ["Informar una situación vial", "Reclamo", "Tránsito"],
          SOLICITAR_UN_REDUCTOR_DE_VELOCIDAD: ["Solicitar un reductor de velocidad", "Solicitud", "Tránsito"],
          SOLICITAR_UN_OPERATIO_DE_TRANSITO: ["Solicitar un operatio de tránsito", "Solicitud", "Tránsito"],
        }),
      },
      {
        id: "estacionamiento",
        name: "Estacionamiento",
        iconName: "Car",
        requestTypes: requestTypes({
          DENUNCIAR_ESTACIONAMIENTO_INDEBIDO: ["Denunciar estacionamiento indebido", "Reclamo", "Tránsito"],
          INFORMAR_UN_PROBLEMA_CON_EL_ESTACIONAMIETO_MEDIDO: ["Informar un problema con el estacionamieto medido", "Reclamo", "Tránsito"],
          CONSULTAR_ZONAS_HORARIOS_O_TARIFAS: ["Consultar zonas, horarios o tarifas", "Consulta", "Tránsito"],
        }),
      },
      {
        id: "cortes-de-calle",
        name: "Cortes de calle",
        iconName: "Barrier",
        requestTypes: requestTypes({
          CONSULTAR_UN_CORTE_DE_CALLE: ["Consultar un corte de calle", "Consulta", "Tránsito"],
          INFORMAR_PROBLEMAS_OCASIONADOS_POR_UN_CORTE: ["Informar problemas ocasionados por un corte", "Reclamo", "Tránsito"],
        }),
      },
      {
        id: "incidentes-viales",
        name: "Incidentes viales",
        iconName: "CarCrash",
        requestTypes: requestTypes({
          INFORMAR_UN_INCIDENTE_VIAL: ["Informar un incidente vial", "Reclamo", "Tránsito"],
        }),
      },
    ],
  },
  {
    id: "infracciones-y-vehiculos-retenidos",
    title: "Infracciones y vehículos retenidos",
    description: "Hacé clic aquí para consultar infracciones, descargos, vehículos retenidos o problemas relacionados con su liberación.",
    iconName: "FileText",
    itemCount: 7,
    badgeText: null,
    subcategories: [
      {
        id: "infracciones",
        name: "Infracciones",
        iconName: "FileWarning",
        requestTypes: requestTypes({
          CONSULTAR_UNA_INFRACCION: ["Consultar una infracción", "Consulta", "Tránsito"],
          INFORMAR_UN_ERROR_EN_LOS_DATOS_DEL_ACTA: ["Informar un error en los datos del acta", "Reclamo", "Tránsito"],
          CONSULTAR_COMO_PRESENTAR_UN_DESCARGO: ["Consultar cómo presentar un descargo", "Consulta", "Tránsito"],
          RECLAMAR_POR_UNA_DEMORA_EN_LA_RESOLUCION: ["Reclamar por una demora en la resolución", "Reclamo", "Tránsito"],
        }),
      },
      {
        id: "vehiculos-detenidos",
        name: "Vehículos detenidos",
        iconName: "Car",
        requestTypes: requestTypes({
          CONSULTAR_REQUISITOS_DE_LIBERACION: ["Consultar requisitos de liberación", "Consulta", "Tránsito"],
          CONSULTAR_ESTADO_DE_UN_VEHICULO_RETENIDO: ["Consultar estado de un vehículo retenido", "Consulta", "Tránsito"],
          RECLAMAR_POR_UNA_DEMORA_EN_LA_LIBERACION: ["Reclamar por una demora en la liberación", "Reclamo", "Tránsito"],
        }),
      },
    ],
  },
  {
    id: "tasas-tributos-y-pagos-municipales",
    title: "Tasas, tributos y pagos municipales",
    description: "Hacé clic aquí para consultar boletas, deudas, pagos, planes de pago, exenciones o informar errores de liquidación.",
    iconName: "Receipt",
    itemCount: 13,
    badgeText: null,
    subcategories: [
      {
        id: "boletas-y-liquidaciones",
        name: "Boletas y liquidaciones",
        iconName: "Receipt",
        requestTypes: requestTypes({
          CONSULTAR_UNA_BOLETA_MUNICIPAL: ["Consultar una boleta municipal", "Consulta", "Rentas"],
          INFORMAR_UN_ERROR_EN_UNA_LIQUIDACION: ["Informar un error en una liquidación", "Reclamo", "Rentas"],
          SOLICITAR_UNA_COPIA_DE_UNA_BOLETA: ["Solicitar una copia de una boleta", "Solicitud", "Rentas"],
        }),
      },
      {
        id: "pagos",
        name: "Pagos",
        iconName: "CreditCard",
        requestTypes: requestTypes({
          INFORMAR_UN_PAGO_NO_REGISTRADO: ["Informar un pago no registrado", "Reclamo", "Rentas"],
          INFORMAR_UN_PAGO_INPUTADO_INCORRECTAMENTE: ["Informar un pago inputado incorrectamente", "Reclamo", "Rentas"],
          SOLICITAR_COMPROBANTE_DE_PAGO: ["Solicitar comprobante de pago", "Solicitud", "Rentas"],
        }),
      },
      {
        id: "deudas",
        name: "Deudas",
        iconName: "DollarSign",
        requestTypes: requestTypes({
          CONSULTAR_DEUDA_MUNICIPAL: ["Consultar deuda municipal", "Consulta", "Rentas"],
          RECLAMAR_POR_UNA_DEUDA_INCORRECTA: ["Reclamar por una deuda incorrecta", "Reclamo", "Rentas"],
        }),
      },
      {
        id: "planes-de-pago",
        name: "Planes de pago",
        iconName: "CalendarClock",
        requestTypes: requestTypes({
          CONSULTAR_OPCIONES_DE_FINANCIACION: ["Consultar opciones de financiación", "Consulta", "Rentas"],
          INFORMAR_UN_PROBLEMA_CON_UN_PLAN_DE_PAGO: ["Informar un problema con un plan de pago", "Reclamo", "Rentas"],
        }),
      },
      {
        id: "exenciones",
        name: "Exenciones",
        iconName: "FileCheck",
        requestTypes: requestTypes({
          CONSULTAR_REQUISITOS_DE_UNA_EXENCION: ["Consultar requisitos de una exención", "Consulta", "Rentas"],
          CONSULTAR_ESTADO_DE_UNA_SOLICITUD_DE_EXENCION: ["Consultar estado de una solicitud de exención", "Consulta", "Rentas"],
          RECLAMAR_POR_UNA_DEMORA_EN_LA_RESOLUCION: ["Reclamar por una demora en la resolución", "Reclamo", "Rentas"],
        }),
      },
    ],
  },
  {
    id: "desarrollo-social-y-asistencia-comunitaria",
    title: "Desarrollo social y asistencia comunitaria",
    description: "Hacé clic aquí para solicitar asistencia social, consultar beneficios o informar una situación de vulnerabilidad.",
    iconName: "HeartHandshake",
    itemCount: 11,
    badgeText: null,
    subcategories: [
      {
        id: "programas-sociales",
        name: "Programas sociales",
        iconName: "Users",
        requestTypes: requestTypes({
          CONSULTAR_PROGRAMAS_DISPONIBLES: ["Consultar programas disponibles", "Consulta", "Desarrollo Social"],
          CONSULTAR_REQUISITOS_DE_UN_BENEFICIO: ["Consultar requisitos de un beneficio", "Consulta", "Desarrollo Social"],
          SOLICITAR_ASISTENCIA_SOCIAL: ["Solicitar asistencia social", "Solicitud", "Desarrollo Social"],
          CONSULTAR_ESTADO_DE_UNA_SOLICITUD: ["Consultar estado de una solicitud", "Consulta", "Desarrollo Social"],
          INFORMAR_UN_PROBLEMA_CON_LA_DOCUMENTACION: ["Informar un problema con la documentación", "Reclamo", "Desarrollo Social"],
        }),
      },
      {
        id: "beneficios",
        name: "Beneficios",
        iconName: "Gift",
        requestTypes: requestTypes({
          RECLAMAR_POR_UNA_DEMORA_EN_LA_EVALUACION: ["Reclamar por una demora en la evaluación", "Reclamo", "Desarrollo Social"],
          INFORMAR_UN_PROBLEMA_CON_UN_BENEFICIO_OTORGADO: ["Informar un problema con un beneficio otorgado", "Reclamo", "Desarrollo Social"],
        }),
      },
      {
        id: "visitas-sociales",
        name: "Visitas sociales",
        iconName: "Home",
        requestTypes: requestTypes({
          CONSULTAR_UNA_VISITA_PROGRAMADA: ["Consultar una visita programada", "Consulta", "Desarrollo Social"],
          SOLICITAR_REPROGRAMACION_DE_UNA_VISITA: ["Solicitar reprogramación de una visita", "Solicitud", "Desarrollo Social"],
        }),
      },
      {
        id: "situaciones-urgentes",
        name: "Situaciones urgentes",
        iconName: "AlertOctagon",
        requestTypes: requestTypes({
          INFORMAR_UNA_SITUACION_DE_VULNERABILIDAD: ["Informar una situación de vulnerabilidad", "Reclamo", "Desarrollo Social"],
          INFORMAR_UNA_PERSONA_EN_SITUACION_DE_CALLE: ["Informar una persona en situación de calle", "Reclamo", "Desarrollo Social"],
        }),
      },
    ],
  },
  {
    id: "salud-comunitaria-y-actividades-municipales",
    title: "Salud comunitaria y actividades municipales",
    description: "Hacé clic aquí para consultar turnos, campañas, talleres, centros municipales o actividades comunitarias.",
    iconName: "Activity",
    itemCount: 6,
    badgeText: null,
    subcategories: [
      {
        id: "turnos-municipales",
        name: "Turnos municipales",
        iconName: "Calendar",
        requestTypes: requestTypes({
          CONSULTAR_DISPONIBILIDAD_DE_TURNOS: ["Consultar disponibilidad de turnos", "Consulta", "Desarrollo Social"],
          INFORMAR_UN_PROBLEMA_DE_TURNO: ["Informar un problema de turno", "Reclamo", "Desarrollo Social"],
          SOLICITAR_REPROGRAMACION_DE_TURNO: ["Solicitar reprogramación de turno", "Solicitud", "Desarrollo Social"],
        }),
      },
      {
        id: "campanas",
        name: "Campañas",
        iconName: "Megaphone",
        requestTypes: requestTypes({
          CONSULTAR_CAMPANAS_COMUNITARIAS: ["Consultar campañas comunitarias", "Consulta", "Desarrollo Social"],
          SUGERIR_UNA_ACTIVIDAD_COMUNITARIA: ["Sugerir una actividad comunitaria", "Sugerencia", "Desarrollo Social"],
        }),
      },
      {
        id: "centro-municipales",
        name: "Centro municipales",
        iconName: "Building",
        requestTypes: requestTypes({
          RECLAMAR_POR_LA_ATENCION_RECIBIDA: ["Reclamar por la atención recibida", "Reclamo", "Desarrollo Social"],
        }),
      },
    ],
  },
  {
    id: "datos-ciudadanos-organizaciones-y-acceso",
    title: "Datos ciudadanos, organizaciones y acceso",
    description: "Hacé clic aquí para actualizar datos personales, informar errores en una cuenta o consultar registros de ciudadanos y organizaciones.",
    iconName: "UserCheck",
    itemCount: 8,
    badgeText: null,
    subcategories: [
      {
        id: "datos-personales",
        name: "Datos personales",
        iconName: "User",
        requestTypes: requestTypes({
          INFORMAR_DATOS_PERSONALES_INCORRECTOS: ["Informar datos personales incorrectos", "Reclamo", "Ciudadanos y Organizaciones"],
          SOLICITAR_ACTUALIZACION_DE_DATOS: ["Solicitar actualización de datos", "Solicitud", "Ciudadanos y Organizaciones"],
          INFORMAR_UN_DOMICILIO_INCORRECTO: ["Informar un domicilio incorrecto", "Reclamo", "Ciudadanos y Organizaciones"],
        }),
      },
      {
        id: "representacion",
        name: "Representación",
        iconName: "Briefcase",
        requestTypes: requestTypes({
          CONSULTAR_UNA_REPRESENTACION: ["Consultar una representación", "Consulta", "Ciudadanos y Organizaciones"],
          INFORMAR_DATOS_INCORRECTOS_DE_UNA_ORGANIZACION: ["Informar datos incorrectos de una organización", "Reclamo", "Ciudadanos y Organizaciones"],
        }),
      },
      {
        id: "cuenta-de-acceso",
        name: "Cuenta de acceso",
        iconName: "KeyRound",
        requestTypes: requestTypes({
          INFORMAR_UN_PROBLEMA_PARA_INGRESAR: ["Informar un problema para ingresar", "Reclamo", "Ciudadanos y Organizaciones"],
          CONSULTAR_COMO_REGISTRARSE: ["Consultar cómo registrarse", "Consulta", "Ciudadanos y Organizaciones"],
          INFORMAR_UN_BLOQUEO_DE_CUENTA: ["Informar un bloqueo de cuenta", "Reclamo", "Ciudadanos y Organizaciones"],
        }),
      },
    ],
  },
  {
    id: "expedientes-y-tramites-municipales",
    title: "Expedientes y trámites municipales",
    description: "Hacé clic aquí para consultar el estado de un expediente, documentación requerida o problemas con la derivación de un trámite.",
    iconName: "FolderCheck",
    itemCount: 6,
    badgeText: null,
    subcategories: [
      {
        id: "seguimiento",
        name: "Seguimiento",
        iconName: "Search",
        requestTypes: requestTypes({
          CONSULTAR_ESTADO_DE_UN_EXPEDIENTE: ["Consultar estado de un expediente", "Consulta", "Ciudadanos y Organizaciones"],
          RECLAMAR_POR_FALTA_DE_ACTUALIZACION: ["Reclamar por falta de actualización", "Reclamo", "Ciudadanos y Organizaciones"],
        }),
      },
      {
        id: "documentacion",
        name: "Documentación",
        iconName: "FileText",
        requestTypes: requestTypes({
          CONSULTAR_DOCUMENTACION_REQUERIDA: ["Consultar documentación requerida", "Consulta", "Ciudadanos y Organizaciones"],
          INFORMAR_UN_PROBLEMA_AL_ADJUNTAR_DOCUMENTOS: ["Informar un problema al adjuntar documentos", "Reclamo", "Ciudadanos y Organizaciones"],
        }),
      },
      {
        id: "derivaciones",
        name: "Derivaciones",
        iconName: "GitBranch",
        requestTypes: requestTypes({
          CONSULTAR_EL_AREA_RESPONSABLE: ["Consultar el área responsable", "Consulta", "Ciudadanos y Organizaciones"],
          RECLAMAR_POR_UNA_DERIVACION_INCORRECTA: ["Reclamar por una derivación incorrecta", "Reclamo", "Call Center"],
        }),
      },
    ],
  },
  {
    id: "atencion-y-funcionamiento-del-portal",
    title: "Atención y funcionamiento del portal",
    description: "Hacé clic aquí para pedir ayuda con el portal, informar errores técnicos, problemas con notificaciones o realizar una consulta general.",
    iconName: "Headphones",
    itemCount: 10,
    badgeText: null,
    subcategories: [
      {
        id: "uso-del-portal",
        name: "Uso del portal",
        iconName: "Monitor",
        requestTypes: requestTypes({
          PEDIR_ORIENTACION_PARA_SELECCIONAR_UNA_OPCION_O_COMPLETAR_EL_FORMULARIO: ["Pedir orientación para seleccionar una opción o completar el formulario", "Consulta", "Call Center"],
          INFORMAR_UN_ERROR_EN_EL_PORTAL: ["Informar un error en el portal", "Reclamo", "Call Center"],
          INFORMAR_UN_PROBLEMA_AL_ADJUNTAR_ARCHIVOS: ["Informar un problema al adjuntar archivos", "Reclamo", "Call Center"],
        }),
      },
      {
        id: "seguimiento-de-tickets",
        name: "Seguimiento de tickets",
        iconName: "FileSearch",
        requestTypes: requestTypes({
          CONSULTAR_UN_NUMERO_DE_SEGUIMIENTO: ["Consultar un número de seguimiento", "Consulta", "Call Center"],
          INFORMAR_QUE_EL_ESTADO_NO_SE_ACTUALIZA: ["Informar que el estado no se actualiza", "Reclamo", "Call Center"],
        }),
      },
      {
        id: "notificaciones",
        name: "Notificaciones",
        iconName: "Bell",
        requestTypes: requestTypes({
          INFORMAR_QUE_NO_RECIBI_UNA_NOTIFICACION: ["Informar que no recibí una notificación", "Reclamo", "Call Center"],
          INFORMAR_UNA_NOTIFICACION_INCORRECTA: ["Informar una notificación incorrecta", "Reclamo", "Call Center"],
        }),
      },
      {
        id: "atencion-municipal",
        name: "Atención municipal",
        iconName: "Headphones",
        requestTypes: requestTypes({
          RECLAMAR_POR_LA_ATENCION_RECIBIDA: ["Reclamar por la atención recibida", "Reclamo", "Call Center"],
          SUGERIR_UNA_MEJORA_EN_EL_PORTAL: ["Sugerir una mejora en el portal", "Sugerencia", "Call Center"],
          REALIZAR_UNA_CONSULTA_GENERAL: ["Realizar una consulta general", "Consulta", "Call Center"],
        }),
      },
    ],
  },
  {
    id: "otro",
    title: "Otro",
    description: "¿No encontrás la categoría que necesitás? Enviá tu consulta o reclamo y nuestro equipo lo derivará al área correspondiente.",
    iconName: "HelpCircle",
    itemCount: 1,
    badgeText: null,
    subcategories: [
      {
        id: "otro-general",
        name: "Consulta general",
        iconName: "HelpCircle",
        requestTypes: requestTypes({
          OTRO_CONSULTA_GENERAL: ["Consulta o reclamo general", "Reclamo", "Mesa de Entrada", "descripcionDetallada", "Enviá tu consulta o reclamo y nuestro equipo lo derivará al área correspondiente."],
        }),
      },
    ],
  },
];

export const NEIGHBORHOODS = [
  { id: "AGRONOMIA", name: "Agronomía" },
  { id: "ALMAGRO", name: "Almagro" },
  { id: "BALVANERA", name: "Balvanera" },
  { id: "BARRACAS", name: "Barracas" },
  { id: "BELGRANO", name: "Belgrano" },
  { id: "BOEDO", name: "Boedo" },
  { id: "CABALLITO", name: "Caballito" },
  { id: "CHACARITA", name: "Chacarita" },
  { id: "COGHLAN", name: "Coghlan" },
  { id: "COLEGIALES", name: "Colegiales" },
  { id: "CONSTITUCION", name: "Constitución" },
  { id: "FLORES", name: "Flores" },
  { id: "FLORESTA", name: "Floresta" },
  { id: "LA_BOCA", name: "La Boca" },
  { id: "LA_PATERNAL", name: "La Paternal" },
  { id: "LINIERS", name: "Liniers" },
  { id: "MATADEROS", name: "Mataderos" },
  { id: "MONTE_CASTRO", name: "Monte Castro" },
  { id: "MONSERRAT", name: "Monserrat" },
  { id: "NUEVA_POMPEYA", name: "Nueva Pompeya" },
  { id: "NUNEZ", name: "Núñez" },
  { id: "PALERMO", name: "Palermo" },
  { id: "PARQUE_AVELLANEDA", name: "Parque Avellaneda" },
  { id: "PARQUE_CHACABUCO", name: "Parque Chacabuco" },
  { id: "PARQUE_CHAS", name: "Parque Chas" },
  { id: "PARQUE_PATRICIOS", name: "Parque Patricios" },
  { id: "PUERTO_MADERO", name: "Puerto Madero" },
  { id: "RECOLETA", name: "Recoleta" },
  { id: "RETIRO", name: "Retiro" },
  { id: "SAAVEDRA", name: "Saavedra" },
  { id: "SAN_CRISTOBAL", name: "San Cristóbal" },
  { id: "SAN_NICOLAS", name: "San Nicolás" },
  { id: "SAN_TELMO", name: "San Telmo" },
  { id: "VELEZ_SARSFIELD", name: "Vélez Sársfield" },
  { id: "VERSALLES", name: "Versalles" },
  { id: "VILLA_CRESPO", name: "Villa Crespo" },
  { id: "VILLA_DEL_PARQUE", name: "Villa del Parque" },
  { id: "VILLA_DEVOTO", name: "Villa Devoto" },
  { id: "VILLA_GENERAL_MITRE", name: "Villa General Mitre" },
  { id: "VILLA_LUGANO", name: "Villa Lugano" },
  { id: "VILLA_LURO", name: "Villa Luro" },
  { id: "VILLA_ORTUZAR", name: "Villa Ortúzar" },
  { id: "VILLA_PUEYRREDON", name: "Villa Pueyrredón" },
  { id: "VILLA_REAL", name: "Villa Real" },
  { id: "VILLA_RIACHUELO", name: "Villa Riachuelo" },
  { id: "VILLA_SANTA_RITA", name: "Villa Santa Rita" },
  { id: "VILLA_SOLDATI", name: "Villa Soldati" },
  { id: "VILLA_URQUIZA", name: "Villa Urquiza" },
];

