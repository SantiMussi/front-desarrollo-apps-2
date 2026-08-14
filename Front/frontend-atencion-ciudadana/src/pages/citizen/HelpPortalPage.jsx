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
