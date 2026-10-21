import { act, fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MetricsPage from "../agent/MetricsPage";
import { AGENT, authFor, renderWithProviders } from "../../test/renderWithProviders";
import { useIndicatorOverview } from "../../hooks/useIndicatorOverview";
import { fetchCategories, fetchNeighborhoods, fetchIndicatorAreas } from "../../services/apiClient";
import { indicatorOverview, emptyOverview } from "../../test/indicatorFixtures";
vi.mock("../../hooks/useIndicatorOverview",()=>({useIndicatorOverview:vi.fn()}));
vi.mock("../../services/apiClient",()=>({fetchCategories:vi.fn(),fetchNeighborhoods:vi.fn(),fetchIndicatorAreas:vi.fn(),getStoredToken:()=>null,exportIndicatorTickets:vi.fn()}));
const refetch=vi.fn();
beforeEach(()=>{
  vi.clearAllMocks(); useIndicatorOverview.mockReturnValue({data:indicatorOverview(),loading:false,error:null,refetch});
  fetchCategories.mockResolvedValue([{id:1,name:"Alumbrado"}]); fetchNeighborhoods.mockResolvedValue([{id:"n1",name:"Palermo"}]);
  fetchIndicatorAreas.mockResolvedValue([{responsibleAreaId:"AREA-LIGHTING",count:125},{responsibleAreaId:"M6",count:2}]);
});
const page=async(user=AGENT)=>{const view=renderWithProviders(<MetricsPage/>,{auth:authFor(user)});await act(async()=>{});return view;};
const kpi=(label)=>within(screen.getByText(label).closest("article"));
describe("MetricsPage con agregación PostgreSQL",()=>{
  it("presenta agregados y gráficos para más de 100 tickets",async()=>{
    await page(); expect(kpi("Tickets creados").getByText("125")).toBeInTheDocument(); expect(kpi("Tickets creados").getByText(/25.0%/)).toBeInTheDocument();
    expect(kpi("Tasa de resolución").getByText("4%")).toBeInTheDocument(); expect(kpi("Tiempo medio de resolución").getByText("4.0 h")).toBeInTheDocument();
    expect(kpi("Cumplimiento de SLA").getByText("75%")).toBeInTheDocument(); expect(screen.getByText("Sin barrio informado")).toBeInTheDocument();
    expect(screen.getByRole("img",{name:/Evolución/})).toBeInTheDocument(); expect(screen.getByText("Activos sin agente M2").previousSibling).toHaveTextContent("3");
  });
  it("envía filtros combinados al servidor, incluido período y SLA",async()=>{
    await page();fireEvent.click(screen.getByRole("button",{name:/Filtros/}));
    for(const [label,value] of [["Período","7"],["Categoría","1"],["Barrio","n1"],["Prioridad","HIGH"],["SLA","breached"],["Área responsable","M6"]]) fireEvent.change(screen.getByLabelText(label),{target:{value}});
    expect(useIndicatorOverview).toHaveBeenLastCalledWith({days:7,categoryId:"1",neighborhoodId:"n1",withoutLocation:false,priority:"HIGH",sla:"breached",responsibleAreaId:"M6"});
    fireEvent.click(screen.getByRole("button",{name:/Restablecer filtros/}));
    expect(useIndicatorOverview).toHaveBeenLastCalledWith(expect.objectContaining({days:30,categoryId:undefined,sla:undefined,responsibleAreaId:undefined}));
    const without=[...screen.getByLabelText("Barrio").options].find(o=>o.text==="Sin ubicación");fireEvent.change(screen.getByLabelText("Barrio"),{target:{value:without.value}});
    expect(useIndicatorOverview).toHaveBeenLastCalledWith(expect.objectContaining({withoutLocation:true,neighborhoodId:undefined}));
    fireEvent.click(screen.getByLabelText("Cerrar filtros"));expect(screen.queryByLabelText("Categoría")).not.toBeInTheDocument();
  });
  it("no presenta ceros ni conserva el reporte ante un error",async()=>{
    useIndicatorOverview.mockReturnValue({data:null,loading:false,error:"Sin conexión",refetch});await page();
    expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión");expect(screen.queryByText("Tickets creados")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Reintentar"));expect(refetch).toHaveBeenCalled();
  });
  it("muestra carga",async()=>{useIndicatorOverview.mockReturnValue({data:null,loading:true});await page();expect(screen.getByText("Calculando métricas…")).toBeInTheDocument();});
  it("representa vacío y ciclos sin evaluación como Sin datos",async()=>{
    useIndicatorOverview.mockReturnValue({data:emptyOverview(),loading:false});await page();expect(kpi("Tickets creados").getByText("0")).toBeInTheDocument();
    expect(kpi("Cumplimiento de SLA").getByText("Sin datos")).toBeInTheDocument();expect(kpi("Tiempo medio de resolución").getByText("—")).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Exportar"})).toBeDisabled();expect(screen.getByText("No hay tickets en este período.")).toBeInTheDocument();expect(screen.getByText("Sin ubicaciones para mostrar.")).toBeInTheDocument();
  });
  it.each(["CITIZEN","AREA_RESPONSIBLE",null])("deniega %s sin consultar",async(role)=>{await page(role?{role}:null);expect(screen.getByRole("alert")).toHaveTextContent("permiso");expect(useIndicatorOverview).not.toHaveBeenCalled();expect(fetchCategories).not.toHaveBeenCalled();});
  it("refresca",async()=>{await page();fireEvent.click(screen.getByTitle("Actualizar"));expect(refetch).toHaveBeenCalledOnce();});
  it("tolera fallos de catálogos sin perder agregados",async()=>{
    fetchCategories.mockRejectedValue(new Error());fetchNeighborhoods.mockRejectedValue(new Error());fetchIndicatorAreas.mockRejectedValue(new Error());await page();expect(kpi("Tickets creados").getByText("125")).toBeInTheDocument();
  });
  it("muestra duración en días, delta negativo y nombres sin fallback",async()=>{
    const data=indicatorOverview();data.counts.averageResolutionHours=72;data.counts.previousTotal=250;data.areas=[{key:"M6",name:"M6",count:125}];data.statuses=[{key:"UNKNOWN",name:"UNKNOWN",count:125}];
    useIndicatorOverview.mockReturnValue({data,loading:false});await page();expect(kpi("Tiempo medio de resolución").getByText("3.0 d")).toBeInTheDocument();expect(kpi("Tickets creados").getByText(/50.0%/)).toBeInTheDocument();expect(screen.getByText("M6")).toBeInTheDocument();
  });
});
