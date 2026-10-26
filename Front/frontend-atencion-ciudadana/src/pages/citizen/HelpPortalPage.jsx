import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, icons, ChevronRight, FileText } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import CategoryCard from "../../components/ui/CategoryCard";
import Breadcrumb from "../../components/ui/Breadcrumb";
import StepIndicator from "../../components/ui/StepIndicator";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import TicketForm from "../../components/ticket/TicketForm";
import ConfirmExitModal from "../../components/ui/ConfirmExitModal";
import PageHeader from "../../components/ui/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import { findRequestTypeMatches } from "../../utils/requestTypeSearch";

export default function HelpPortalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, loading, error } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState(null);

  const [showExitModal, setShowExitModal] = useState(false);
  const pendingAction = useRef(null);
  const [formDirty, setFormDirty] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('idle');

  // El TicketForm avisa cuando el form tiene datos
  const handleFormDirtyChange = useCallback((dirty) => {
    setFormDirty(dirty);
  }, []);

  useEffect(() => {
    if (!selectedRequestType || !formDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [selectedRequestType, formDirty]);

  // Hacer scroll automático hacia arriba al avanzar o retroceder de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategory, selectedSubcategory, selectedRequestType]);

  const guardNavigation = useCallback(
    (action) => {
      if (selectedRequestType && formDirty) {
        pendingAction.current = action;
        setShowExitModal(true);
      } else {
        action();
      }
    },
    [selectedRequestType, formDirty]
  );

  const confirmExit = useCallback(() => {
    setShowExitModal(false);
    setFormDirty(false);
    if (pendingAction.current) {
      pendingAction.current();
      pendingAction.current = null;
    }
  }, []);

  const cancelExit = useCallback(() => {
    setShowExitModal(false);
    pendingAction.current = null;
  }, []);

  const updateSelection = (category, subcategory, requestType) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSelectedRequestType(requestType);
    setTicketStatus('idle');

    setSearchParams((prev) => {
      if (category) prev.set("category", category.id);
      else prev.delete("category");

      if (subcategory) prev.set("subcategory", subcategory.id);
      else prev.delete("subcategory");

      if (requestType) prev.set("requestType", requestType.code);
      else prev.delete("requestType");

      return prev;
    }, { replace: true });
  };

  useEffect(() => {
    if (categories.length === 0) return;

    const catId = searchParams.get("category");
    const subId = searchParams.get("subcategory");
    const reqCode = searchParams.get("requestType");

    let foundCat = null;
    let foundSub = null;
    let foundReq = null;

    if (catId) {
      foundCat = categories.find((c) => c.id === catId);
      if (foundCat && subId) {
        foundSub = foundCat.subcategories.find((s) => s.id === subId);
        if (foundSub && reqCode) {
          foundReq = foundSub.requestTypes.find((r) => r.code === reqCode);
        }
      }
    }

    // Derive selection from URL params - use functional updates to batch
    const newSelection = { cat: foundCat || null, sub: foundSub || null, req: foundReq || null };
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedCategory((prev) => prev === newSelection.cat ? prev : newSelection.cat);
    setSelectedSubcategory((prev) => prev === newSelection.sub ? prev : newSelection.sub);
    setSelectedRequestType((prev) => prev === newSelection.req ? prev : newSelection.req);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, categories]);

  const query = searchParams.get("q")?.toLowerCase();

  const searchResults =
    query && !selectedCategory && !selectedSubcategory && !selectedRequestType && categories.length > 0
      ? findRequestTypeMatches(categories, query)
      : [];

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
    const doBreadcrumb = () => {
      if (index === -1) {
        updateSelection(null, null, null);
        return;
      }
      if (index === 0) {
        updateSelection(selectedCategory, null, null);
      } else if (index === 1) {
        updateSelection(selectedCategory, selectedSubcategory, null);
      }
    };

    guardNavigation(doBreadcrumb);
  };

  const handleBack = () => {
    const doBack = () => {
      if (selectedCategory?.id === "otro") {
        navigate("/");
        return;
      }
      if (selectedRequestType) {
        updateSelection(selectedCategory, selectedSubcategory, null);
      } else if (selectedSubcategory) {
        updateSelection(selectedCategory, null, null);
      } else if (selectedCategory) {
        updateSelection(null, null, null);
      } else {
        navigate("/");
      }
    };

    guardNavigation(doBack);
  };

  const handleNewTicket = () => {
    updateSelection(null, null, null);
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
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
            onDirtyChange={handleFormDirtyChange}
            onStatusChange={setTicketStatus}
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

          {selectedSubcategory.requestTypes.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-neutral-100">
              <FileText className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-neutral-900">Todavía no hay trámites disponibles acá</p>
              <p className="text-[13px] text-neutral-500 mt-1">Probá con otra subcategoría o volvé más adelante.</p>
            </div>
          ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedSubcategory.requestTypes.map((rt) => (
              <button
                key={rt.code}
                type="button"
                onClick={() => updateSelection(selectedCategory, selectedSubcategory, rt)}
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
          )}
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

          {selectedCategory.subcategories.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-neutral-100">
              <FileText className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-neutral-900">Todavía no hay trámites disponibles en esta área</p>
              <p className="text-[13px] text-neutral-500 mt-1">Probá con otra categoría o volvé más adelante.</p>
            </div>
          ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCategory.subcategories.map((sub) => {
              const IconComponent = icons[sub.iconName];
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => updateSelection(selectedCategory, sub, null)}
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
                      {sub.requestTypes.map(rt => rt.name).join(", ")}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-[#D63031] transition-all group-hover:translate-x-0.5" strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
          )}
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
                    updateSelection(result.category, result.subcategory, result.requestType);
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
              onClick={() => updateSelection(category, null, null)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100svh-58px)]">
      <PageHeader
        label="Atención Ciudadana"
        title="Portal de"
        highlight="Ayuda"
        description="Seleccioná una categoría, elegí el tipo de trámite y completá tu solicitud en pocos pasos."
      />

      {!selectedRequestType && (
        <section className="border-b border-neutral-200/60 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-6">
            <SearchBar key={searchParams.toString()} />
          </div>
        </section>
      )}

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
            <StepIndicator currentStep={currentStep} status={ticketStatus} />
          </div>

          <div className="py-8 sm:py-10">
            {renderStepContent()}
          </div>
        </div>
      </div>
      <ConfirmExitModal
        isOpen={showExitModal}
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </div>
  );
}
