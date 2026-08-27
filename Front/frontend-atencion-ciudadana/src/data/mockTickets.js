export const MOCK_TICKETS = [
  {
    id: "T-8924",
    resumen: "Rotura de caño maestro de agua",
    informador: {
      nombre: "María Castro",
      iniciales: "MC",
    },
    responsable: {
      nombre: "Tú",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    estado: "Abierto",
    creado: "Hoy 10:23",
    sla: "Vencido por 2h",
    categoria: "Servicios Públicos",
    prioridad: "Alta",
    barrio: "Centro",
  },
  {
    id: "T-8923",
    resumen: "Semáforo intermitente en cruce escolar",
    informador: {
      nombre: "Juan Gómez",
      iniciales: "JG",
    },
    responsable: {
      nombre: "Tú",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    estado: "En Progreso",
    creado: "Ayer 15:40",
    sla: "4h restantes",
    categoria: "Tránsito",
    prioridad: "Media",
    barrio: "Palermo",
  },
  {
    id: "T-8919",
    resumen: "Vehículo abandonado en vía pública",
    informador: {
      nombre: "Laura Ruiz",
      iniciales: "LR",
    },
    responsable: {
      nombre: "Tú",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    estado: "Cerrado (Duplicado)",
    creado: "Ayer 14:30",
    sla: "-",
    categoria: "Tránsito",
    prioridad: "Baja",
    barrio: "Belgrano",
  },
  {
    id: "T-8915",
    resumen: "Solicitud poda de árbol (No urgente)",
    informador: {
      nombre: "Pedro Díaz",
      iniciales: "PD",
    },
    responsable: {
      nombre: "Tú",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    estado: "Abierto",
    creado: "23/10/2026",
    sla: "48h restantes",
    categoria: "Arbolado",
    prioridad: "Baja",
    barrio: "Recoleta",
  },
  {
    id: "T-8910",
    resumen: "Bache profundo en avenida principal",
    informador: {
      nombre: "Sofía Martínez",
      iniciales: "SM",
    },
    responsable: {
      nombre: "Carlos López",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    estado: "Abierto",
    creado: "22/10/2026",
    sla: "Vencido por 24h",
    categoria: "Infraestructura",
    prioridad: "Alta",
    barrio: "Caballito",
  },
  {
    id: "T-8905",
    resumen: "Falta de iluminación en plaza",
    informador: {
      nombre: "Diego Fernández",
      iniciales: "DF",
    },
    responsable: {
      nombre: "Tú",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    estado: "Resuelto",
    creado: "20/10/2026",
    sla: "-",
    categoria: "Servicios Públicos",
    prioridad: "Media",
    barrio: "Almagro",
  },
  {
    id: "T-8900",
    resumen: "Ramas caídas obstruyendo la calle",
    informador: {
      nombre: "Ana Clara",
      iniciales: "AC",
    },
    responsable: {
      nombre: "Sin asignar",
      avatar: null,
    },
    estado: "Abierto",
    creado: "19/10/2026",
    sla: "24h restantes",
    categoria: "Arbolado",
    prioridad: "Media",
    barrio: "Centro",
  }
];

export const MOCK_CATEGORIES_LIST = [
  "Servicios Públicos",
  "Tránsito",
  "Arbolado",
  "Infraestructura",
  "Higiene Urbana"
];

export const MOCK_PRIORITIES = ["Alta", "Media", "Baja"];

export const MOCK_NEIGHBORHOODS = [
  "Centro",
  "Palermo",
  "Belgrano",
  "Recoleta",
  "Caballito",
  "Almagro"
];

export const MOCK_STATUSES = [
  "Abierto",
  "En Progreso",
  "Resuelto",
  "Cerrado",
  "Cerrado (Duplicado)"
];
