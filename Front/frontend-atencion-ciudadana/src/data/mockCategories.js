export const MOCK_CATEGORIES = [
  {
    "id": "calles-veredas-e-infraestructura-urbana",
    "title": "Calles, veredas e infraestructura urbana",
    "description": "Hacé clic aquí para informar baches, calles o veredas dañadas, desagües tapados u otros problemas de infraestructura urbana.",
    "iconName": "Construction",
    "itemCount": 12,
    "badgeText": null,
    "subcategories": [
      {
        "id": "calles-y-pavimento",
        "name": "Calles y Pavimento",
        "iconName": "Construction",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_BACHE",
            "name": "Informar un bache",
            "description": "Reclamo referente a informar un bache - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_CALLE_DETERIORADA",
            "name": "Informar una calle deteriorada",
            "description": "Reclamo referente a informar una calle deteriorada - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_REPARACION_DE_CALLE",
            "name": "Solicitar reparación de calle",
            "description": "Solicitud referente a solicitar reparación de calle - Área asignada: Obras Públicas.",
            "ticketType": "Solicitud",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_OBRA_INCONCLUSA",
            "name": "Informar una obra inconclusa",
            "description": "Reclamo referente a informar una obra inconclusa - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "veredas",
        "name": "Veredas",
        "iconName": "Footprints",
        "requestTypes": [
          {
            "code": "INFORMAR_UNA_VEREDA_ROTA",
            "name": "Informar una vereda rota",
            "description": "Reclamo referente a informar una vereda rota - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_REPARACION_DE_VEREDA_MUNICIPAL",
            "name": "Solicitar reparación de vereda municipal",
            "description": "Solicitud referente a solicitar reparación de vereda municipal - Área asignada: Obras Públicas.",
            "ticketType": "Solicitud",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_VEREDA_OBSTRUIDA",
            "name": "Informar una vereda obstruida",
            "description": "Reclamo referente a informar una vereda obstruida - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "desagues",
        "name": "Desagües",
        "iconName": "Droplets",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_DESAGUE_TAPADO",
            "name": "Informar un desagüe tapado",
            "description": "Reclamo referente a informar un desagüe tapado - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_ACUMULACION_DE_AGUA",
            "name": "Informar acumulación de agua",
            "description": "Reclamo referente a informar acumulación de agua - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_LIMPIEZA_DE_DESAGUE",
            "name": "Solicitar limpieza de desagüe",
            "description": "Solicitud referente a solicitar limpieza de desagüe - Área asignada: Obras Públicas.",
            "ticketType": "Solicitud",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "edificios-municipales",
        "name": "Edificios Municipales",
        "iconName": "Building2",
        "requestTypes": [
          {
            "code": "INFORMAR_DANOS_EN_UN_EDIFICIO_MUNICIPAL",
            "name": "Informar daños en un edificio municipal",
            "description": "Reclamo referente a informar daños en un edificio municipal - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_PROBLEMAS_DE_ACCESIBILIDAD",
            "name": "Informar problemas de accesibilidad",
            "description": "Reclamo referente a informar problemas de accesibilidad - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "alumbrado-y-equipamiento-urbano",
    "title": "Alumbrado y equipamiento urbano",
    "description": "Hacé clic aquí para informar luminarias apagadas, columnas dañadas, cables expuestos o problemas con el mobiliario urbano.",
    "iconName": "Lightbulb",
    "itemCount": 8,
    "badgeText": null,
    "subcategories": [
      {
        "id": "alumbrado-publico",
        "name": "Alumbrado público",
        "iconName": "Lamp",
        "requestTypes": [
          {
            "code": "INFORMAR_UNA_LUMINARIA_APAGADA",
            "name": "Informar una luminaria apagada",
            "description": "Reclamo referente a informar una luminaria apagada - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_LUMINARIA_INTERMITENTE",
            "name": "Informar una luminaria intermitente",
            "description": "Reclamo referente a informar una luminaria intermitente - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_COLUMNA_DANADA",
            "name": "Informar una columna dañada",
            "description": "Reclamo referente a informar una columna dañada - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_CABLES_EXPUESTOS",
            "name": "Informar una cables expuestos",
            "description": "Reclamo referente a informar una cables expuestos - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_NUEVA_ILUMINACION",
            "name": "Solicitar nueva iluminación",
            "description": "Solicitud referente a solicitar nueva iluminación - Área asignada: Obras Públicas.",
            "ticketType": "Solicitud",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "mobiliario-urbano",
        "name": "Mobiliario urbano",
        "iconName": "Armchair",
        "requestTypes": [
          {
            "code": "INFORMAR_MOBILIARIO_DANADO",
            "name": "Informar mobiliario dañado",
            "description": "Reclamo referente a informar mobiliario dañado - Área asignada: Obras Públicas.",
            "ticketType": "Reclamo",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITA_INSTALACION_DE_MOBILIARIO",
            "name": "Solicita instalación de mobiliario",
            "description": "Solicitud referente a solicita instalación de mobiliario - Área asignada: Obras Públicas.",
            "ticketType": "Solicitud",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "espacios-publicos",
        "name": "Espacios públicos",
        "iconName": "MapPin",
        "requestTypes": [
          {
            "code": "SUGERIR_MEJORAS_EN_UN_ESPACIO_PUBLICO",
            "name": "Sugerir mejoras en un espacio público",
            "description": "Sugerencia referente a sugerir mejoras en un espacio público - Área asignada: Obras Públicas.",
            "ticketType": "Sugerencia",
            "assignedArea": "Obras Públicas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "limpieza-residuos-y-servicios-urbanos",
    "title": "Limpieza, residuos y servicios urbanos",
    "description": "Hacé clic aquí para informar falta de recolección, contenedores desbordados, residuos acumulados o solicitar servicios de limpieza.",
    "iconName": "Trash2",
    "itemCount": 14,
    "badgeText": null,
    "subcategories": [
      {
        "id": "recoleccion-domiciliaria",
        "name": "Recolección domiciliaria",
        "iconName": "Trash",
        "requestTypes": [
          {
            "code": "INFORMAR_FALTA_DE_RECOLECCION",
            "name": "Informar falta de recolección",
            "description": "Reclamo referente a informar falta de recolección - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_RECOLECCION_FUERA_DE_HORARIO",
            "name": "Informar recolección fuera de horario",
            "description": "Reclamo referente a informar recolección fuera de horario - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "residuos-voluminosos",
        "name": "Residuos voluminosos",
        "iconName": "Truck",
        "requestTypes": [
          {
            "code": "SOLICITAR_RETIRO_DE_RESIDUOS_VOLUMINOSOS",
            "name": "Solicitar retiro de residuos voluminosos",
            "description": "Solicitud referente a solicitar retiro de residuos voluminosos - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "test",
                "label": "test",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_COMO_DISPONER_RESIDUOS_ESPECIALES",
            "name": "Consultar cómo disponer residuos especiales",
            "description": "Consulta referente a consultar cómo disponer residuos especiales - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Consulta",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "contenedores",
        "name": "Contenedores",
        "iconName": "Trash2",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_CONTENEDOR_DESBORDADO",
            "name": "Informar un contenedor desbordado",
            "description": "Reclamo referente a informar un contenedor desbordado - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_CONTENEDOR_DANADO",
            "name": "Informar un contenedor dañado",
            "description": "Reclamo referente a informar un contenedor dañado - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_LIMPIEZA_DE_UN_CONTENEDOR",
            "name": "Solicitar limpieza de un contenedor",
            "description": "Solicitud referente a solicitar limpieza de un contenedor - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_REUBICACION_DE_UN_CONTENEDOR",
            "name": "Solicitar reubicación de un contenedor",
            "description": "Solicitud referente a solicitar reubicación de un contenedor - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_UN_NUEVO_CONTENEDOR",
            "name": "Solicitar un nuevo contenedor",
            "description": "Solicitud referente a solicitar un nuevo contenedor - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "limpieza-urbana",
        "name": "Limpieza urbana",
        "iconName": "Sparkles",
        "requestTypes": [
          {
            "code": "INFORMAR_SUCIEDAD_EN_LA_VIA_PUBLICA",
            "name": "Informar suciedad en la vía pública",
            "description": "Reclamo referente a informar suciedad en la vía pública - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_MICROBASURAL",
            "name": "Informar un microbasural",
            "description": "Reclamo referente a informar un microbasural - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_UN_OPERATIVO_DE_LIMPIEZA",
            "name": "Solicitar un operativo de limpieza",
            "description": "Solicitud referente a solicitar un operativo de limpieza - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "reciclaje",
        "name": "Reciclaje",
        "iconName": "Recycle",
        "requestTypes": [
          {
            "code": "CONSULTAR_PUNTOS_VERDES",
            "name": "Consultar puntos verdes",
            "description": "Consulta referente a consultar puntos verdes - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Consulta",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SUGERIR_UN_NUEVO_PUNTO_VERDE",
            "name": "Sugerir un nuevo punto verde",
            "description": "Sugerencia referente a sugerir un nuevo punto verde - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Sugerencia",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "arbolado-plazas-y-espacios-verdes",
    "title": "Arbolado, plazas y espacios verdes",
    "description": "Hacé clic aquí para informar árboles o ramas peligrosas, solicitar poda o reportar problemas en plazas y parques.",
    "iconName": "Trees",
    "itemCount": 10,
    "badgeText": null,
    "subcategories": [
      {
        "id": "arbolado-publico",
        "name": "Arbolado público",
        "iconName": "TreePine",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_ARBOL_CON_RIESGO_DE_CAIDA",
            "name": "Informar un árbol con riesgo de caída",
            "description": "Reclamo referente a informar un árbol con riesgo de caída - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_RAMA_PELIGROSA",
            "name": "Informar una rama peligrosa",
            "description": "Reclamo referente a informar una rama peligrosa - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_PODA",
            "name": "Solicitar poda",
            "description": "Solicitud referente a solicitar poda - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_EXTRACCION_DE_UN_ARBOL",
            "name": "Solicitar extracción de un árbol",
            "description": "Solicitud referente a solicitar extracción de un árbol - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_PLANTACION_DE_UN_ARBOL",
            "name": "Solicitar plantación de un arbol",
            "description": "Solicitud referente a solicitar plantación de un arbol - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Solicitud",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "DENUNCIAR_DANO_AL_ARBOLADO",
            "name": "Denunciar daño al arbolado",
            "description": "Reclamo referente a denunciar daño al arbolado - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "plazas-y-parques",
        "name": "Plazas y parques",
        "iconName": "Trees",
        "requestTypes": [
          {
            "code": "INFORMAR_FALTA_DE_MANTENIMIENTO",
            "name": "Informar falta de mantenimiento",
            "description": "Reclamo referente a informar falta de mantenimiento - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_JUEGOS_DANADOS",
            "name": "Informar juegos dañados",
            "description": "Reclamo referente a informar juegos dañados - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_PROBLEMAS_DE_RIESGO",
            "name": "Informar problemas de riesgo",
            "description": "Reclamo referente a informar problemas de riesgo - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SUGERIR_MEJORAS_PARA_UNA_PLAZA",
            "name": "Sugerir mejoras para una plaza",
            "description": "Sugerencia referente a sugerir mejoras para una plaza - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Sugerencia",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "ambiente-y-convivencia-urbana",
    "title": "Ambiente y convivencia urbana",
    "description": "Hacé clic aquí para denunciar ruidos molestos, contaminación, vertidos, malos olores o situaciones que afecten la convivencia.",
    "iconName": "ShieldAlert",
    "itemCount": 8,
    "badgeText": null,
    "subcategories": [
      {
        "id": "ruidos-molestos",
        "name": "Ruidos molestos",
        "iconName": "Volume2",
        "requestTypes": [
          {
            "code": "DENUNCIAR_RUIDOS_DE_UN_COMERCIO",
            "name": "Denunciar ruidos de un comercio",
            "description": "Reclamo referente a denunciar ruidos de un comercio - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "DENUNCIAR_RUIDOS_EN_LA_VIA_PUBLICA",
            "name": "Denunciar ruidos en la vía pública",
            "description": "Reclamo referente a denunciar ruidos en la vía pública - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "contaminacion",
        "name": "Contaminación",
        "iconName": "Biohazard",
        "requestTypes": [
          {
            "code": "DENUNCIAR_VERTIDO_DE_LIQUIDOS_O_RESIDUOS",
            "name": "Denunciar vertido de líquidos o residuos",
            "description": "Reclamo referente a denunciar vertido de líquidos o residuos - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "DENUNCIAR_HUMO_O_OLORES_MOLESTOS",
            "name": "Denunciar humo o olores molestos",
            "description": "Reclamo referente a denunciar humo o olores molestos - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_PRESENCIA_DE_RESIDUOS_PELIGROSOS",
            "name": "Informar presencia de residuos peligrosos",
            "description": "Reclamo referente a informar presencia de residuos peligrosos - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "higiene",
        "name": "Higiene",
        "iconName": "Sparkles",
        "requestTypes": [
          {
            "code": "DENUNCIAR_CONDICIONES_INSALUBRE",
            "name": "Denunciar condiciones insalubre",
            "description": "Reclamo referente a denunciar condiciones insalubre - Área asignada: Ambiente y Servicios Urbanos.",
            "ticketType": "Reclamo",
            "assignedArea": "Ambiente y Servicios Urbanos",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "DENUNCIAR_FALTA_DE_HIGIENE_EN_UN_COMERCIO",
            "name": "Denunciar falta de higiene en un comercio",
            "description": "Reclamo referente a denunciar falta de higiene en un comercio - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "ocupacion-del-espacio-publico",
        "name": "Ocupación del espacio público",
        "iconName": "MapPinOff",
        "requestTypes": [
          {
            "code": "DENUNCIAR_OCUPACION_IRREGULAR_OKUPAS",
            "name": "Denunciar ocupación irregular (okupas)",
            "description": "Reclamo referente a denunciar ocupación irregular (okupas) - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "comercios-habilitaciones-e-inspecciones",
    "title": "Comercios, habilitaciones e inspecciones",
    "description": "Hacé clic aquí para consultar habilitaciones, informar problemas con inspecciones o denunciar posibles irregularidades comerciales.",
    "iconName": "Store",
    "itemCount": 12,
    "badgeText": null,
    "subcategories": [
      {
        "id": "habilitacion-comercial",
        "name": "Habilitación comercial",
        "iconName": "Store",
        "requestTypes": [
          {
            "code": "CONSULTAR_REQUISITOS_DE_HABILITACION",
            "name": "Consultar requisitos de habilitación",
            "description": "Consulta referente a consultar requisitos de habilitación - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Consulta",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_ESTADO_DE_UNA_HABILITACION",
            "name": "Consultar estado de una habilitación",
            "description": "Consulta referente a consultar estado de una habilitación - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Consulta",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_CON_LA_DOCUMENTACION",
            "name": "Informar un problema con la documentación",
            "description": "Reclamo referente a informar un problema con la documentación - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_ORIENTACION_PARA_RENOVAR_UNA_HABILITACION",
            "name": "Solicitar orientación para renovar una habilitación",
            "description": "Solicitud referente a solicitar orientación para renovar una habilitación - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Solicitud",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "inspecciones",
        "name": "Inspecciones",
        "iconName": "ClipboardCheck",
        "requestTypes": [
          {
            "code": "CONSULTAR_UNA_INSPECCION_PROGRAMADA",
            "name": "Consultar una inspección programada",
            "description": "Consulta referente a consultar una inspección programada - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Consulta",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_REPROGRAMACION_DE_UNA_INSPECCION",
            "name": "Solicitar reprogramación de una inspección",
            "description": "Solicitud referente a solicitar reprogramación de una inspección - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Solicitud",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_UNA_DEMORA_EN_LA_INSPECCION",
            "name": "Reclamar por una demora en la inspección",
            "description": "Reclamo referente a reclamar por una demora en la inspección - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "denuncias-comerciales",
        "name": "Denuncias comerciales",
        "iconName": "AlertTriangle",
        "requestTypes": [
          {
            "code": "DENUNCIAR_UN_COMERCIO_SIN_HABILITACION",
            "name": "Denunciar un comercio sin habilitación",
            "description": "Reclamo referente a denunciar un comercio sin habilitación - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "DENUNCIAR_INCUMPLIMIENTOS_HORARIOS",
            "name": "Denunciar incumplimientos horarios",
            "description": "Reclamo referente a denunciar incumplimientos horarios - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "DENUNCIAR_ACTIVIDAD_NO_AUTORIZADA",
            "name": "Denunciar actividad no autorizada",
            "description": "Reclamo referente a denunciar actividad no autorizada - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "clausuras-e-intimaciones",
        "name": "Clausuras e intimaciones",
        "iconName": "Ban",
        "requestTypes": [
          {
            "code": "CONSULTAR_UNA_INTIMACION_O_CLAUSURA",
            "name": "Consultar una intimación o clausura",
            "description": "Consulta referente a consultar una intimación o clausura - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Consulta",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_POSIBLE_INCUMPLIMIENTO_DE_CLAUSURA",
            "name": "Informar un posible incumplimiento de clausura",
            "description": "Reclamo referente a informar un posible incumplimiento de clausura - Área asignada: Habilitaciones y Control Comercial.",
            "ticketType": "Reclamo",
            "assignedArea": "Habilitaciones y Control Comercial",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "transito-y-seguridad-vial",
    "title": "Tránsito y seguridad vial",
    "description": "Hacé clic aquí para contactarnos por semáforos, señalización, estacionamiento, circulación o situaciones de riesgo vial.",
    "iconName": "TrafficCone",
    "itemCount": 14,
    "badgeText": null,
    "subcategories": [
      {
        "id": "semaforos",
        "name": "Semáforos",
        "iconName": "TrafficCone",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_SEMAFORO_FUERA_DE_SERVICIO",
            "name": "Informar un semáforo fuera de servicio",
            "description": "Reclamo referente a informar un semáforo fuera de servicio - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_SEMAFORO_DESCOORDINADO",
            "name": "Informar un semáforo descoordinado",
            "description": "Reclamo referente a informar un semáforo descoordinado - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "senalizacion",
        "name": "Señalización",
        "iconName": "SignpostBig",
        "requestTypes": [
          {
            "code": "INFORMAR_UNA_SENAL_DANADA_O_FALTANTE",
            "name": "Informar una señal dañada o faltante",
            "description": "Reclamo referente a informar una señal dañada o faltante - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_NUEVA_SENALIZACION",
            "name": "Solicitar nueva señalización",
            "description": "Solicitud referente a solicitar nueva señalización - Área asignada: Tránsito.",
            "ticketType": "Solicitud",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SUGERIR_CAMBIOS_DE_CIRCULACION",
            "name": "Sugerir cambios de circulación",
            "description": "Sugerencia referente a sugerir cambios de circulación - Área asignada: Tránsito.",
            "ticketType": "Sugerencia",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "seguridad-vial",
        "name": "Seguridad vial",
        "iconName": "ShieldAlert",
        "requestTypes": [
          {
            "code": "INFORMAR_UNA_SITUACION_VIAL",
            "name": "Informar una situación vial",
            "description": "Reclamo referente a informar una situación vial - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_UN_REDUCTOR_DE_VELOCIDAD",
            "name": "Solicitar un reductor de velocidad",
            "description": "Solicitud referente a solicitar un reductor de velocidad - Área asignada: Tránsito.",
            "ticketType": "Solicitud",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_UN_OPERATIO_DE_TRANSITO",
            "name": "Solicitar un operatio de tránsito",
            "description": "Solicitud referente a solicitar un operatio de tránsito - Área asignada: Tránsito.",
            "ticketType": "Solicitud",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "estacionamiento",
        "name": "Estacionamiento",
        "iconName": "Car",
        "requestTypes": [
          {
            "code": "DENUNCIAR_ESTACIONAMIENTO_INDEBIDO",
            "name": "Denunciar estacionamiento indebido",
            "description": "Reclamo referente a denunciar estacionamiento indebido - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_CON_EL_ESTACIONAMIETO_MEDIDO",
            "name": "Informar un problema con el estacionamieto medido",
            "description": "Reclamo referente a informar un problema con el estacionamieto medido - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_ZONAS_HORARIOS_O_TARIFAS",
            "name": "Consultar zonas, horarios o tarifas",
            "description": "Consulta referente a consultar zonas, horarios o tarifas - Área asignada: Tránsito.",
            "ticketType": "Consulta",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "cortes-de-calle",
        "name": "Cortes de calle",
        "iconName": "Barrier",
        "requestTypes": [
          {
            "code": "CONSULTAR_UN_CORTE_DE_CALLE",
            "name": "Consultar un corte de calle",
            "description": "Consulta referente a consultar un corte de calle - Área asignada: Tránsito.",
            "ticketType": "Consulta",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_PROBLEMAS_OCASIONADOS_POR_UN_CORTE",
            "name": "Informar problemas ocasionados por un corte",
            "description": "Reclamo referente a informar problemas ocasionados por un corte - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "incidentes-viales",
        "name": "Incidentes viales",
        "iconName": "CarCrash",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_INCIDENTE_VIAL",
            "name": "Informar un incidente vial",
            "description": "Reclamo referente a informar un incidente vial - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "infracciones-y-vehiculos-retenidos",
    "title": "Infracciones y vehículos retenidos",
    "description": "Hacé clic aquí para consultar infracciones, descargos, vehículos retenidos o problemas relacionados con su liberación.",
    "iconName": "FileText",
    "itemCount": 7,
    "badgeText": null,
    "subcategories": [
      {
        "id": "infracciones",
        "name": "Infracciones",
        "iconName": "FileWarning",
        "requestTypes": [
          {
            "code": "CONSULTAR_UNA_INFRACCION",
            "name": "Consultar una infracción",
            "description": "Consulta referente a consultar una infracción - Área asignada: Tránsito.",
            "ticketType": "Consulta",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_ERROR_EN_LOS_DATOS_DEL_ACTA",
            "name": "Informar un error en los datos del acta",
            "description": "Reclamo referente a informar un error en los datos del acta - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_COMO_PRESENTAR_UN_DESCARGO",
            "name": "Consultar cómo presentar un descargo",
            "description": "Consulta referente a consultar cómo presentar un descargo - Área asignada: Tránsito.",
            "ticketType": "Consulta",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_UNA_DEMORA_EN_LA_RESOLUCION",
            "name": "Reclamar por una demora en la resolución",
            "description": "Reclamo referente a reclamar por una demora en la resolución - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "vehiculos-detenidos",
        "name": "Vehículos detenidos",
        "iconName": "Car",
        "requestTypes": [
          {
            "code": "CONSULTAR_REQUISITOS_DE_LIBERACION",
            "name": "Consultar requisitos de liberación",
            "description": "Consulta referente a consultar requisitos de liberación - Área asignada: Tránsito.",
            "ticketType": "Consulta",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_ESTADO_DE_UN_VEHICULO_RETENIDO",
            "name": "Consultar estado de un vehículo retenido",
            "description": "Consulta referente a consultar estado de un vehículo retenido - Área asignada: Tránsito.",
            "ticketType": "Consulta",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_UNA_DEMORA_EN_LA_LIBERACION",
            "name": "Reclamar por una demora en la liberación",
            "description": "Reclamo referente a reclamar por una demora en la liberación - Área asignada: Tránsito.",
            "ticketType": "Reclamo",
            "assignedArea": "Tránsito",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "tasas-tributos-y-pagos-municipales",
    "title": "Tasas, tributos y pagos municipales",
    "description": "Hacé clic aquí para consultar boletas, deudas, pagos, planes de pago, exenciones o informar errores de liquidación.",
    "iconName": "Receipt",
    "itemCount": 13,
    "badgeText": null,
    "subcategories": [
      {
        "id": "boletas-y-liquidaciones",
        "name": "Boletas y liquidaciones",
        "iconName": "Receipt",
        "requestTypes": [
          {
            "code": "CONSULTAR_UNA_BOLETA_MUNICIPAL",
            "name": "Consultar una boleta municipal",
            "description": "Consulta referente a consultar una boleta municipal - Área asignada: Rentas.",
            "ticketType": "Consulta",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_ERROR_EN_UNA_LIQUIDACION",
            "name": "Informar un error en una liquidación",
            "description": "Reclamo referente a informar un error en una liquidación - Área asignada: Rentas.",
            "ticketType": "Reclamo",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_UNA_COPIA_DE_UNA_BOLETA",
            "name": "Solicitar una copia de una boleta",
            "description": "Solicitud referente a solicitar una copia de una boleta - Área asignada: Rentas.",
            "ticketType": "Solicitud",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "pagos",
        "name": "Pagos",
        "iconName": "CreditCard",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_PAGO_NO_REGISTRADO",
            "name": "Informar un pago no registrado",
            "description": "Reclamo referente a informar un pago no registrado - Área asignada: Rentas.",
            "ticketType": "Reclamo",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PAGO_INPUTADO_INCORRECTAMENTE",
            "name": "Informar un pago inputado incorrectamente",
            "description": "Reclamo referente a informar un pago inputado incorrectamente - Área asignada: Rentas.",
            "ticketType": "Reclamo",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_COMPROBANTE_DE_PAGO",
            "name": "Solicitar comprobante de pago",
            "description": "Solicitud referente a solicitar comprobante de pago - Área asignada: Rentas.",
            "ticketType": "Solicitud",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "deudas",
        "name": "Deudas",
        "iconName": "DollarSign",
        "requestTypes": [
          {
            "code": "CONSULTAR_DEUDA_MUNICIPAL",
            "name": "Consultar deuda municipal",
            "description": "Consulta referente a consultar deuda municipal - Área asignada: Rentas.",
            "ticketType": "Consulta",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_UNA_DEUDA_INCORRECTA",
            "name": "Reclamar por una deuda incorrecta",
            "description": "Reclamo referente a reclamar por una deuda incorrecta - Área asignada: Rentas.",
            "ticketType": "Reclamo",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "planes-de-pago",
        "name": "Planes de pago",
        "iconName": "CalendarClock",
        "requestTypes": [
          {
            "code": "CONSULTAR_OPCIONES_DE_FINANCIACION",
            "name": "Consultar opciones de financiación",
            "description": "Consulta referente a consultar opciones de financiación - Área asignada: Rentas.",
            "ticketType": "Consulta",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_CON_UN_PLAN_DE_PAGO",
            "name": "Informar un problema con un plan de pago",
            "description": "Reclamo referente a informar un problema con un plan de pago - Área asignada: Rentas.",
            "ticketType": "Reclamo",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "exenciones",
        "name": "Exenciones",
        "iconName": "FileCheck",
        "requestTypes": [
          {
            "code": "CONSULTAR_REQUISITOS_DE_UNA_EXENCION",
            "name": "Consultar requisitos de una exención",
            "description": "Consulta referente a consultar requisitos de una exención - Área asignada: Rentas.",
            "ticketType": "Consulta",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_ESTADO_DE_UNA_SOLICITUD_DE_EXENCION",
            "name": "Consultar estado de una solicitud de exención",
            "description": "Consulta referente a consultar estado de una solicitud de exención - Área asignada: Rentas.",
            "ticketType": "Consulta",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_UNA_DEMORA_EN_LA_RESOLUCION",
            "name": "Reclamar por una demora en la resolución",
            "description": "Reclamo referente a reclamar por una demora en la resolución - Área asignada: Rentas.",
            "ticketType": "Reclamo",
            "assignedArea": "Rentas",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "desarrollo-social-y-asistencia-comunitaria",
    "title": "Desarrollo social y asistencia comunitaria",
    "description": "Hacé clic aquí para solicitar asistencia social, consultar beneficios o informar una situación de vulnerabilidad.",
    "iconName": "HeartHandshake",
    "itemCount": 11,
    "badgeText": null,
    "subcategories": [
      {
        "id": "programas-sociales",
        "name": "Programas sociales",
        "iconName": "Users",
        "requestTypes": [
          {
            "code": "CONSULTAR_PROGRAMAS_DISPONIBLES",
            "name": "Consultar programas disponibles",
            "description": "Consulta referente a consultar programas disponibles - Área asignada: Desarrollo Social.",
            "ticketType": "Consulta",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_REQUISITOS_DE_UN_BENEFICIO",
            "name": "Consultar requisitos de un beneficio",
            "description": "Consulta referente a consultar requisitos de un beneficio - Área asignada: Desarrollo Social.",
            "ticketType": "Consulta",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_ASISTENCIA_SOCIAL",
            "name": "Solicitar asistencia social",
            "description": "Solicitud referente a solicitar asistencia social - Área asignada: Desarrollo Social.",
            "ticketType": "Solicitud",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_ESTADO_DE_UNA_SOLICITUD",
            "name": "Consultar estado de una solicitud",
            "description": "Consulta referente a consultar estado de una solicitud - Área asignada: Desarrollo Social.",
            "ticketType": "Consulta",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_CON_LA_DOCUMENTACION",
            "name": "Informar un problema con la documentación",
            "description": "Reclamo referente a informar un problema con la documentación - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "beneficios",
        "name": "Beneficios",
        "iconName": "Gift",
        "requestTypes": [
          {
            "code": "RECLAMAR_POR_UNA_DEMORA_EN_LA_EVALUACION",
            "name": "Reclamar por una demora en la evaluación",
            "description": "Reclamo referente a reclamar por una demora en la evaluación - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_CON_UN_BENEFICIO_OTORGADO",
            "name": "Informar un problema con un beneficio otorgado",
            "description": "Reclamo referente a informar un problema con un beneficio otorgado - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "visitas-sociales",
        "name": "Visitas sociales",
        "iconName": "Home",
        "requestTypes": [
          {
            "code": "CONSULTAR_UNA_VISITA_PROGRAMADA",
            "name": "Consultar una visita programada",
            "description": "Consulta referente a consultar una visita programada - Área asignada: Desarrollo Social.",
            "ticketType": "Consulta",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_REPROGRAMACION_DE_UNA_VISITA",
            "name": "Solicitar reprogramación de una visita",
            "description": "Solicitud referente a solicitar reprogramación de una visita - Área asignada: Desarrollo Social.",
            "ticketType": "Solicitud",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "situaciones-urgentes",
        "name": "Situaciones urgentes",
        "iconName": "AlertOctagon",
        "requestTypes": [
          {
            "code": "INFORMAR_UNA_SITUACION_DE_VULNERABILIDAD",
            "name": "Informar una situación de vulnerabilidad",
            "description": "Reclamo referente a informar una situación de vulnerabilidad - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_PERSONA_EN_SITUACION_DE_CALLE",
            "name": "Informar una persona en situación de calle",
            "description": "Reclamo referente a informar una persona en situación de calle - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "salud-comunitaria-y-actividades-municipales",
    "title": "Salud comunitaria y actividades municipales",
    "description": "Hacé clic aquí para consultar turnos, campañas, talleres, centros municipales o actividades comunitarias.",
    "iconName": "Activity",
    "itemCount": 6,
    "badgeText": null,
    "subcategories": [
      {
        "id": "turnos-municipales",
        "name": "Turnos municipales",
        "iconName": "Calendar",
        "requestTypes": [
          {
            "code": "CONSULTAR_DISPONIBILIDAD_DE_TURNOS",
            "name": "Consultar disponibilidad de turnos",
            "description": "Consulta referente a consultar disponibilidad de turnos - Área asignada: Desarrollo Social.",
            "ticketType": "Consulta",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_DE_TURNO",
            "name": "Informar un problema de turno",
            "description": "Reclamo referente a informar un problema de turno - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_REPROGRAMACION_DE_TURNO",
            "name": "Solicitar reprogramación de turno",
            "description": "Solicitud referente a solicitar reprogramación de turno - Área asignada: Desarrollo Social.",
            "ticketType": "Solicitud",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "campanas",
        "name": "Campañas",
        "iconName": "Megaphone",
        "requestTypes": [
          {
            "code": "CONSULTAR_CAMPANAS_COMUNITARIAS",
            "name": "Consultar campañas comunitarias",
            "description": "Consulta referente a consultar campañas comunitarias - Área asignada: Desarrollo Social.",
            "ticketType": "Consulta",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SUGERIR_UNA_ACTIVIDAD_COMUNITARIA",
            "name": "Sugerir una actividad comunitaria",
            "description": "Sugerencia referente a sugerir una actividad comunitaria - Área asignada: Desarrollo Social.",
            "ticketType": "Sugerencia",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "centro-municipales",
        "name": "Centro municipales",
        "iconName": "Building",
        "requestTypes": [
          {
            "code": "RECLAMAR_POR_LA_ATENCION_RECIBIDA",
            "name": "Reclamar por la atención recibida",
            "description": "Reclamo referente a reclamar por la atención recibida - Área asignada: Desarrollo Social.",
            "ticketType": "Reclamo",
            "assignedArea": "Desarrollo Social",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "datos-ciudadanos-organizaciones-y-acceso",
    "title": "Datos ciudadanos, organizaciones y acceso",
    "description": "Hacé clic aquí para actualizar datos personales, informar errores en una cuenta o consultar registros de ciudadanos y organizaciones.",
    "iconName": "UserCheck",
    "itemCount": 8,
    "badgeText": null,
    "subcategories": [
      {
        "id": "datos-personales",
        "name": "Datos personales",
        "iconName": "User",
        "requestTypes": [
          {
            "code": "INFORMAR_DATOS_PERSONALES_INCORRECTOS",
            "name": "Informar datos personales incorrectos",
            "description": "Reclamo referente a informar datos personales incorrectos - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SOLICITAR_ACTUALIZACION_DE_DATOS",
            "name": "Solicitar actualización de datos",
            "description": "Solicitud referente a solicitar actualización de datos - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Solicitud",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_DOMICILIO_INCORRECTO",
            "name": "Informar un domicilio incorrecto",
            "description": "Reclamo referente a informar un domicilio incorrecto - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "representacion",
        "name": "Representación",
        "iconName": "Briefcase",
        "requestTypes": [
          {
            "code": "CONSULTAR_UNA_REPRESENTACION",
            "name": "Consultar una representación",
            "description": "Consulta referente a consultar una representación - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Consulta",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_DATOS_INCORRECTOS_DE_UNA_ORGANIZACION",
            "name": "Informar datos incorrectos de una organización",
            "description": "Reclamo referente a informar datos incorrectos de una organización - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "cuenta-de-acceso",
        "name": "Cuenta de acceso",
        "iconName": "KeyRound",
        "requestTypes": [
          {
            "code": "INFORMAR_UN_PROBLEMA_PARA_INGRESAR",
            "name": "Informar un problema para ingresar",
            "description": "Reclamo referente a informar un problema para ingresar - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "CONSULTAR_COMO_REGISTRARSE",
            "name": "Consultar cómo registrarse",
            "description": "Consulta referente a consultar cómo registrarse - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Consulta",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_BLOQUEO_DE_CUENTA",
            "name": "Informar un bloqueo de cuenta",
            "description": "Reclamo referente a informar un bloqueo de cuenta - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "expedientes-y-tramites-municipales",
    "title": "Expedientes y trámites municipales",
    "description": "Hacé clic aquí para consultar el estado de un expediente, documentación requerida o problemas con la derivación de un trámite.",
    "iconName": "FolderCheck",
    "itemCount": 6,
    "badgeText": null,
    "subcategories": [
      {
        "id": "seguimiento",
        "name": "Seguimiento",
        "iconName": "Search",
        "requestTypes": [
          {
            "code": "CONSULTAR_ESTADO_DE_UN_EXPEDIENTE",
            "name": "Consultar estado de un expediente",
            "description": "Consulta referente a consultar estado de un expediente - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Consulta",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_FALTA_DE_ACTUALIZACION",
            "name": "Reclamar por falta de actualización",
            "description": "Reclamo referente a reclamar por falta de actualización - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "documentacion",
        "name": "Documentación",
        "iconName": "FileText",
        "requestTypes": [
          {
            "code": "CONSULTAR_DOCUMENTACION_REQUERIDA",
            "name": "Consultar documentación requerida",
            "description": "Consulta referente a consultar documentación requerida - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Consulta",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_AL_ADJUNTAR_DOCUMENTOS",
            "name": "Informar un problema al adjuntar documentos",
            "description": "Reclamo referente a informar un problema al adjuntar documentos - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Reclamo",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "derivaciones",
        "name": "Derivaciones",
        "iconName": "GitBranch",
        "requestTypes": [
          {
            "code": "CONSULTAR_EL_AREA_RESPONSABLE",
            "name": "Consultar el área responsable",
            "description": "Consulta referente a consultar el área responsable - Área asignada: Ciudadanos y Organizaciones.",
            "ticketType": "Consulta",
            "assignedArea": "Ciudadanos y Organizaciones",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "RECLAMAR_POR_UNA_DERIVACION_INCORRECTA",
            "name": "Reclamar por una derivación incorrecta",
            "description": "Reclamo referente a reclamar por una derivación incorrecta - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "atencion-y-funcionamiento-del-portal",
    "title": "Atención y funcionamiento del portal",
    "description": "Hacé clic aquí para pedir ayuda con el portal, informar errores técnicos, problemas con notificaciones o realizar una consulta general.",
    "iconName": "Headphones",
    "itemCount": 10,
    "badgeText": null,
    "subcategories": [
      {
        "id": "uso-del-portal",
        "name": "Uso del portal",
        "iconName": "Monitor",
        "requestTypes": [
          {
            "code": "PEDIR_ORIENTACION_PARA_SELECCIONAR_UNA_OPCION_O_COMPLETAR_EL_FORMULARIO",
            "name": "Pedir orientación para seleccionar una opción o completar el formulario",
            "description": "Consulta referente a pedir orientación para seleccionar una opción o completar el formulario - Área asignada: Call Center.",
            "ticketType": "Consulta",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_ERROR_EN_EL_PORTAL",
            "name": "Informar un error en el portal",
            "description": "Reclamo referente a informar un error en el portal - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UN_PROBLEMA_AL_ADJUNTAR_ARCHIVOS",
            "name": "Informar un problema al adjuntar archivos",
            "description": "Reclamo referente a informar un problema al adjuntar archivos - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "seguimiento-de-tickets",
        "name": "Seguimiento de tickets",
        "iconName": "FileSearch",
        "requestTypes": [
          {
            "code": "CONSULTAR_UN_NUMERO_DE_SEGUIMIENTO",
            "name": "Consultar un número de seguimiento",
            "description": "Consulta referente a consultar un número de seguimiento - Área asignada: Call Center.",
            "ticketType": "Consulta",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_QUE_EL_ESTADO_NO_SE_ACTUALIZA",
            "name": "Informar que el estado no se actualiza",
            "description": "Reclamo referente a informar que el estado no se actualiza - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "notificaciones",
        "name": "Notificaciones",
        "iconName": "Bell",
        "requestTypes": [
          {
            "code": "INFORMAR_QUE_NO_RECIBI_UNA_NOTIFICACION",
            "name": "Informar que no recibí una notificación",
            "description": "Reclamo referente a informar que no recibí una notificación - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "INFORMAR_UNA_NOTIFICACION_INCORRECTA",
            "name": "Informar una notificación incorrecta",
            "description": "Reclamo referente a informar una notificación incorrecta - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "atencion-municipal",
        "name": "Atención municipal",
        "iconName": "Headphones",
        "requestTypes": [
          {
            "code": "RECLAMAR_POR_LA_ATENCION_RECIBIDA",
            "name": "Reclamar por la atención recibida",
            "description": "Reclamo referente a reclamar por la atención recibida - Área asignada: Call Center.",
            "ticketType": "Reclamo",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "SUGERIR_UNA_MEJORA_EN_EL_PORTAL",
            "name": "Sugerir una mejora en el portal",
            "description": "Sugerencia referente a sugerir una mejora en el portal - Área asignada: Call Center.",
            "ticketType": "Sugerencia",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          },
          {
            "code": "REALIZAR_UNA_CONSULTA_GENERAL",
            "name": "Realizar una consulta general",
            "description": "Consulta referente a realizar una consulta general - Área asignada: Call Center.",
            "ticketType": "Consulta",
            "assignedArea": "Call Center",
            "specificFields": [
              {
                "key": "descripcionDetallada",
                "label": "Descripción detallada",
                "type": "textarea",
                "placeholder": "Describa en detalle la situación o motivo...",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  }
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
];
