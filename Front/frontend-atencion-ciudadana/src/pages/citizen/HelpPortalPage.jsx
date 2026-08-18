import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, icons, ChevronRight, FileText } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import CategoryCard from "../../components/ui/CategoryCard";
import Breadcrumb from "../../components/ui/Breadcrumb";
import StepIndicator from "../../components/ui/StepIndicator";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import TicketForm from "../../components/ui/TicketForm";

export default function HelpPortalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, loading, error } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState(null);

  useEffect(() => {
    const categoryId = searchParams.get("category");
    if (categoryId && categories.length > 0) {
      const found = categories.find((c) => c.id === categoryId);
      if (found) setSelectedCategory(found);
    }
  }, [searchParams, categories]);

  const query = searchParams.get("q")?.toLowerCase();

  let searchResults = [];
  if (query && !selectedCategory && !selectedSubcategory && !selectedRequestType && categories.length > 0) {
    // Función para normalizar texto: minúsculas + sin tildes/diacríticos
    const normalize = (text) =>
      text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Diccionario de sinónimos para expandir la búsqueda
    // Todas las claves y valores van SIN tildes (ya normalizados)
    const synonyms = {
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

    const normalizedQuery = normalize(query);

    // Construimos los términos de búsqueda expandidos
    const searchTerms = new Set([normalizedQuery]);

    Object.entries(synonyms).forEach(([key, values]) => {
      // Si la búsqueda incluye la clave o alguno de los sinónimos, agregamos todos al set de términos
      const matchesGroup = normalizedQuery.includes(key) || values.some(v => normalizedQuery.includes(v));
      if (matchesGroup) {
        searchTerms.add(key);
        values.forEach(v => searchTerms.add(v));
      }
    });

    const searchTermsArray = Array.from(searchTerms);

    categories.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.requestTypes.forEach(rt => {
          // Normalizamos también el texto de las categorías para comparar sin tildes
          const textToSearch = normalize([
            rt.name,
            rt.description,
            sub.name,
            cat.title
          ].join(" "));

          // Verificamos si algún término expandido coincide con la categoría/subcategoría/trámite
          const hasMatch = searchTermsArray.some(term => textToSearch.includes(term));

          if (hasMatch) {
            searchResults.push({ category: cat, subcategory: sub, requestType: rt });
          }
        });
      });
    });

  }

  const currentStep = selectedRequestType
    ? 3
    : selectedSubcategory
      ? 2
      : selectedCategory
        ? 1
        : 0;

  const breadcrumbItems = [];
  if (selectedCategory) {
    breadcrumbItems.push({ id: "cat", label: selectedCategory.title });
  } else if (query) {
    breadcrumbItems.push({ id: "search", label: `Búsqueda: ${searchParams.get("q")}` });
  }

  if (selectedSubcategory) {
    breadcrumbItems.push({ id: "sub", label: selectedSubcategory.name });
  }
  if (selectedRequestType) {
    breadcrumbItems.push({ id: "rt", label: selectedRequestType.name });
  }

  const handleBreadcrumbNavigate = (index) => {
    if (index === -1) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedRequestType(null);
      return;
    }
    if (index === 0) {
      setSelectedSubcategory(null);
      setSelectedRequestType(null);
    } else if (index === 1) {
      setSelectedRequestType(null);
    }
  };

  const handleBack = () => {
    if (selectedRequestType) {
      setSelectedRequestType(null);
    } else if (selectedSubcategory) {
      setSelectedSubcategory(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      navigate("/");
    }
  };

  const handleNewTicket = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedRequestType(null);
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-[14px] text-neutral-400">Cargando categorías...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-10">
          <Alert variant="error" title="Error al cargar">
            {error}
          </Alert>
        </div>
      );
    }

    if (selectedRequestType) {
      return (
        <div className="mx-auto max-w-2xl">
          <TicketForm
            requestType={selectedRequestType}
            onBack={handleBack}
            onNewTicket={handleNewTicket}
          />
        </div>
      );
    }

    if (selectedSubcategory) {
      return (
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5 bg-[#D63031]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
                  Tipo de solicitud
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                ¿Qué necesitás gestionar?
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {selectedSubcategory.requestTypes.map((rt) => (
              <button
                key={rt.code}
                type="button"
                onClick={() => setSelectedRequestType(rt)}
                className="group relative flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-5 text-left
                           transition-all duration-300 hover:border-[#D63031]/20 hover:shadow-[0_4px_24px_-6px_rgba(214,48,49,0.08)]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031]/40 focus-visible:ring-offset-2"
              >
                <div className="absolute top-0 left-3 right-3 h-0.5 bg-[#D63031] rounded-full scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D63031]/5 transition-colors group-hover:bg-[#D63031]/10">
                    <FileText className="h-4 w-4 text-[#D63031]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-neutral-900 group-hover:text-[#0F2C59] transition-colors">
                    {rt.name}
                  </h3>
                </div>

                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  {rt.description}
                </p>

                <div className="flex items-center gap-1 mt-auto pt-1 text-[12px] text-neutral-300 group-hover:text-[#D63031] transition-colors">
                  <span>Iniciar solicitud</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedCategory) {
      return (
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5 bg-[#D63031]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
                  Subcategorías
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                Seleccioná un área dentro de {selectedCategory.title}
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCategory.subcategories.map((sub) => {
              const IconComponent = icons[sub.iconName];
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubcategory(sub)}
                  className="group relative flex items-center gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 text-left
                             transition-all duration-300 hover:border-[#D63031]/20 hover:shadow-[0_4px_24px_-6px_rgba(214,48,49,0.08)]
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D63031]/40 focus-visible:ring-offset-2"
                >
                  <div className="absolute top-0 left-3 right-3 h-0.5 bg-[#D63031] rounded-full scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 transition-colors group-hover:bg-[#D63031]/5">
                    {IconComponent ? (
                      <IconComponent className="h-5 w-5 text-neutral-400 group-hover:text-[#D63031] transition-colors" strokeWidth={1.5} />
                    ) : (
                      <span className="text-xs text-neutral-400">?</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-neutral-900 group-hover:text-[#0F2C59] transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-[12px] text-neutral-400 mt-0.5">
                      {sub.requestTypes.length} {sub.requestTypes.length === 1 ? "trámite" : "trámites"}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-[#D63031] transition-all group-hover:translate-x-0.5" strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (query) {
      return (
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5 bg-[#D63031]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
                  Resultados de búsqueda
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                Trámites para "{searchParams.get("q")}"
              </h2>
            </div>
            <span className="hidden sm:inline text-[11px] text-neutral-300 tabular-nums">
              {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-neutral-100">
              <FileText className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-neutral-900">No encontramos resultados</p>
              <p className="text-[13px] text-neutral-500 mt-1">Intentá con otras palabras clave o navegá por las categorías.</p>
              <button
                onClick={() => { searchParams.delete("q"); navigate("/portal-ayuda", { replace: true }); }}
                className="mt-4 px-4 py-2 bg-neutral-100 text-[13px] font-medium text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Ver todas las categorías
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((result) => (
                <button
                  key={result.requestType.code}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(result.category);
                    setSelectedSubcategory(result.subcategory);
                    setSelectedRequestType(result.requestType);
                  }}
                  className="group relative flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-5 text-left
                             transition-all duration-300 hover:border-[#D63031]/20 hover:shadow-[0_4px_24px_-6px_rgba(214,48,49,0.08)]"
                >
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {result.category.title}
                    </span>
                    <ChevronRight className="h-2.5 w-2.5 text-neutral-300" />
                    <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {result.subcategory.name}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-neutral-900 group-hover:text-[#0F2C59] transition-colors leading-tight">
                    {result.requestType.name}
                  </h3>
                  <p className="text-[12px] text-neutral-400 leading-relaxed line-clamp-2">
                    {result.requestType.description}
                  </p>
                  <div className="flex items-center gap-1 mt-auto pt-1 text-[12px] text-neutral-300 group-hover:text-[#D63031] transition-colors">
                    <span>Iniciar solicitud</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-5 bg-[#D63031]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D63031]">
                Áreas de atención
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              ¿Sobre qué es tu consulta?
            </h2>
          </div>
          <span className="hidden sm:inline text-[11px] text-neutral-300 tabular-nums">
            {categories.length} categorías
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              description={category.description}
              iconName={category.iconName}
              itemCount={category.itemCount}
              badgeText={category.badgeText}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100svh-58px)]">
      <section className="relative bg-[#0F2C59] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F2C59] via-[#0c244a] to-[#071630]">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[100%] rounded-full bg-gradient-to-b from-[#2563eb] to-transparent opacity-25 blur-[120px] mix-blend-screen" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[80%] rounded-full bg-gradient-to-t from-[#D63031] to-transparent opacity-20 blur-[100px] mix-blend-screen" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2] tracking-tight text-white">
              Portal de <span className="text-[#D63031]">Ayuda</span>
            </h1>
            <p className="mt-2 text-[14px] text-blue-200/60 max-w-md">
              Seleccioná una categoría, elegí el tipo de trámite y completá tu solicitud.
            </p>
          </div>
        </div>
      </section>

      <div className="flex-1 bg-[#fafafa]">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-5 border-b border-neutral-200/60">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400
                             transition-all hover:border-[#D63031]/20 hover:text-[#D63031]"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
              <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
            </div>
            <StepIndicator currentStep={currentStep} />
          </div>

          <div className="py-8 sm:py-10">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
