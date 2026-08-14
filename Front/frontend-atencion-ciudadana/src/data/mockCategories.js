export const MOCK_CATEGORIES = [
  {
    id: "urban-services",
    title: "Servicios Urbanos",
    description:
      "Alumbrado público, recolección de residuos, limpieza de calles y espacios verdes.",
    iconName: "Lightbulb",
    itemCount: 124,
    badgeText: "Popular",
    subcategories: [
      {
        id: "lighting",
        name: "Alumbrado Público",
        iconName: "Lamp",
        requestTypes: [
          {
            code: "LUMINARIA_ROTA",
            name: "Luminaria rota o apagada",
            description: "Reportar una luminaria que no funciona o está dañada.",
            specificFields: [
              {
                key: "nroPoste",
                label: "Número de poste",
                type: "text",
                placeholder: "Ej: P-1044",
                required: false,
              },
              {
                key: "fallaDetectada",
                label: "Tipo de falla",
                type: "select",
                options: [
                  { value: "APAGADA", label: "Apagada completamente" },
                  { value: "TITILA", label: "Titila / intermitente" },
                  { value: "LUZ_BAJA", label: "Luz muy baja" },
                  { value: "ROTA", label: "Luminaria rota / vandalizada" },
                ],
                required: true,
              },
            ],
          },
          {
            code: "SEMAFORO_ROTO",
            name: "Semáforo defectuoso",
            description: "Semáforo que no funciona correctamente.",
            specificFields: [
              {
                key: "cruceCalles",
                label: "Cruce de calles",
                type: "text",
                placeholder: "Ej: Av. Corrientes y Florida",
                required: true,
              },
              {
                key: "fallaDetectada",
                label: "Tipo de falla",
                type: "select",
                options: [
                  { value: "NO_FUNCIONA", label: "No funciona" },
                  { value: "DESINCRONIZADO", label: "Desincronizado" },
                  { value: "LUZ_QUEMADA", label: "Luz quemada" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
      {
        id: "waste",
        name: "Residuos y Limpieza",
        iconName: "Trash2",
        requestTypes: [
          {
            code: "RESIDUOS_VOLUMINOSOS",
            name: "Retiro de residuos voluminosos",
            description: "Solicitar retiro de muebles, escombros u objetos grandes.",
            specificFields: [
              {
                key: "tipoResiduo",
                label: "Tipo de residuo",
                type: "select",
                options: [
                  { value: "MUEBLES", label: "Muebles" },
                  { value: "ESCOMBROS", label: "Escombros" },
                  { value: "RAMAS", label: "Ramas y poda" },
                  { value: "ELECTRODOMESTICOS", label: "Electrodomésticos" },
                  { value: "OTRO", label: "Otro" },
                ],
                required: true,
              },
              {
                key: "volumenEstimado",
                label: "Volumen estimado",
                type: "select",
                options: [
                  { value: "PEQUENO", label: "Pequeño (bolsa)" },
                  { value: "MEDIANO", label: "Mediano (1-3 objetos)" },
                  { value: "GRANDE", label: "Grande (más de 3 objetos)" },
                ],
                required: false,
              },
            ],
          },
          {
            code: "CONTENEDOR_DANADO",
            name: "Contenedor dañado o faltante",
            description: "Reportar un contenedor roto, quemado o faltante.",
            specificFields: [
              {
                key: "tipoContenedor",
                label: "Tipo de contenedor",
                type: "select",
                options: [
                  { value: "VERDE", label: "Verde (residuos comunes)" },
                  { value: "NEGRO", label: "Negro (reciclables)" },
                  { value: "CAMPANA", label: "Campana de vidrio" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "public-works",
    title: "Obras Públicas",
    description:
      "Baches, veredas en mal estado, obras en construcción y mantenimiento vial.",
    iconName: "HardHat",
    itemCount: 89,
    badgeText: null,
    subcategories: [
      {
        id: "roads",
        name: "Calzadas y Veredas",
        iconName: "Construction",
        requestTypes: [
          {
            code: "BACHE_CALZADA",
            name: "Bache en calzada",
            description: "Reportar un bache en la calle o avenida.",
            specificFields: [
              {
                key: "tamano",
                label: "Tamaño aproximado",
                type: "select",
                options: [
                  { value: "CHICO", label: "Chico (menor a 30cm)" },
                  { value: "MEDIANO", label: "Mediano (30-60cm)" },
                  { value: "GRANDE", label: "Grande (mayor a 60cm)" },
                ],
                required: true,
              },
              {
                key: "profundidad",
                label: "Profundidad estimada",
                type: "select",
                options: [
                  { value: "SUPERFICIAL", label: "Superficial" },
                  { value: "PROFUNDO", label: "Profundo (más de 10cm)" },
                ],
                required: false,
              },
            ],
          },
          {
            code: "VEREDA_ROTA",
            name: "Vereda en mal estado",
            description: "Vereda rota, levantada o con riesgo de caída.",
            specificFields: [
              {
                key: "tipoDano",
                label: "Tipo de daño",
                type: "select",
                options: [
                  { value: "BALDOSA_ROTA", label: "Baldosa rota" },
                  { value: "LEVANTADA", label: "Levantada por raíces" },
                  { value: "HUNDIDA", label: "Hundida" },
                  { value: "FALTANTE", label: "Baldosa faltante" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "traffic-mobility",
    title: "Tránsito y Movilidad",
    description:
      "Semáforos, señalización, estacionamiento medido y transporte público.",
    iconName: "TrafficCone",
    itemCount: 67,
    badgeText: "Nuevo",
    subcategories: [
      {
        id: "signage",
        name: "Señalización",
        iconName: "SignpostBig",
        requestTypes: [
          {
            code: "SENAL_DANADA",
            name: "Señal de tránsito dañada",
            description: "Señal vial caída, ilegible o faltante.",
            specificFields: [
              {
                key: "tipoSenal",
                label: "Tipo de señal",
                type: "text",
                placeholder: "Ej: Pare, velocidad máxima, sentido único",
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "commercial-permits",
    title: "Habilitaciones Comerciales",
    description:
      "Habilitación de comercios, permisos de uso de suelo y consultas normativas.",
    iconName: "Store",
    itemCount: 45,
    badgeText: null,
    subcategories: [
      {
        id: "inspections",
        name: "Inspecciones",
        iconName: "ClipboardCheck",
        requestTypes: [
          {
            code: "INSPECCION_COMERCIO",
            name: "Solicitar inspección comercial",
            description: "Solicitar una inspección para un comercio.",
            specificFields: [
              {
                key: "nombreFantasiaComercio",
                label: "Nombre del comercio",
                type: "text",
                placeholder: "Nombre de fantasía del comercio",
                required: true,
              },
              {
                key: "rubro",
                label: "Rubro",
                type: "select",
                options: [
                  { value: "GASTRONOMIA", label: "Gastronomía" },
                  { value: "COMERCIO_MINORISTA", label: "Comercio minorista" },
                  { value: "SERVICIOS", label: "Servicios" },
                  { value: "OTRO", label: "Otro" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "citizen-reports",
    title: "Denuncias Ciudadanas",
    description:
      "Ruidos molestos, ocupación indebida del espacio público y contravenciones.",
    iconName: "ShieldAlert",
    itemCount: 203,
    badgeText: "Urgente",
    subcategories: [
      {
        id: "noise",
        name: "Ruidos Molestos",
        iconName: "Volume2",
        requestTypes: [
          {
            code: "RUIDO_MOLESTO",
            name: "Denuncia por ruidos molestos",
            description: "Ruidos excesivos provenientes de un establecimiento o domicilio.",
            specificFields: [
              {
                key: "origenRuido",
                label: "Origen del ruido",
                type: "select",
                options: [
                  { value: "COMERCIO", label: "Comercio / bar" },
                  { value: "OBRA", label: "Obra en construcción" },
                  { value: "DOMICILIO", label: "Domicilio particular" },
                  { value: "VIA_PUBLICA", label: "Vía pública" },
                ],
                required: true,
              },
              {
                key: "horarioHabitual",
                label: "Horario habitual del ruido",
                type: "text",
                placeholder: "Ej: De 23:00 a 04:00",
                required: false,
              },
            ],
          },
        ],
      },
      {
        id: "public-space",
        name: "Espacio Público",
        iconName: "MapPinOff",
        requestTypes: [
          {
            code: "OCUPACION_ESPACIO",
            name: "Ocupación indebida del espacio público",
            description: "Mesas, mercadería u objetos que obstruyen la vereda.",
            specificFields: [
              {
                key: "tipoOcupacion",
                label: "Tipo de ocupación",
                type: "select",
                options: [
                  { value: "MESAS", label: "Mesas de bar/restaurante" },
                  { value: "MERCADERIA", label: "Mercadería exhibida" },
                  { value: "VEHICULO", label: "Vehículo abandonado" },
                  { value: "OTRO", label: "Otro" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "social-development",
    title: "Desarrollo Social",
    description:
      "Programas sociales, asistencia alimentaria, atención a personas en situación de calle.",
    iconName: "HeartHandshake",
    itemCount: 56,
    badgeText: null,
    subcategories: [
      {
        id: "social-programs",
        name: "Programas Sociales",
        iconName: "Users",
        requestTypes: [
          {
            code: "CONSULTA_PROGRAMA",
            name: "Consulta sobre programas sociales",
            description: "Información sobre programas de asistencia disponibles.",
            specificFields: [
              {
                key: "tipoAsistencia",
                label: "Tipo de asistencia requerida",
                type: "select",
                options: [
                  { value: "ALIMENTARIA", label: "Asistencia alimentaria" },
                  { value: "HABITACIONAL", label: "Asistencia habitacional" },
                  { value: "LABORAL", label: "Inserción laboral" },
                  { value: "SALUD", label: "Salud" },
                  { value: "OTRO", label: "Otro" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
      {
        id: "trees",
        name: "Arbolado Urbano",
        iconName: "TreePine",
        requestTypes: [
          {
            code: "PODA_ARBOL",
            name: "Solicitud de poda",
            description: "Árbol que necesita poda por riesgo o interferencia.",
            specificFields: [
              {
                key: "especieArbol",
                label: "Especie del árbol (si la conoce)",
                type: "text",
                placeholder: "Ej: Fresno, Tipa, Plátano",
                required: false,
              },
              {
                key: "riesgoCaida",
                label: "¿Presenta riesgo de caída?",
                type: "select",
                options: [
                  { value: "SI", label: "Sí, riesgo inminente" },
                  { value: "POSIBLE", label: "Posiblemente" },
                  { value: "NO", label: "No, solo requiere poda" },
                ],
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
];

export const NEIGHBORHOODS = [
  { id: "VILLA_LIMA", name: "Villa Lima" },
  { id: "ALTOS_DE_CHILE", name: "Altos de Chile" },
  { id: "BARRIO_SAN_BERNARDO", name: "San Bernardo" },
  { id: "PARQUE_INDEPENDENCIA", name: "Parque Independencia" },
  { id: "RINCON_AZUL", name: "Rincón Azul" },
  { id: "DISTRITO_EMPRESARIAL", name: "Distrito Empresarial" },
  { id: "COSTA_PINAMAR", name: "Costa Pinamar" },
  { id: "JARDINES_DE_BELGRANO_SUR", name: "Jardines de Belgrano Sur" },
  { id: "VILLA_UNIVERSITARIA", name: "Villa Universitaria" },
  { id: "NUEVA_CONCORDIA", name: "Nueva Concordia" },
  { id: "CENTRO_HISTORICO", name: "Centro Histórico" },
  { id: "OTRO", name: "Otro" },
]
