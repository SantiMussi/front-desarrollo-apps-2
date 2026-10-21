import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import DashboardPage from "../agent/DashboardPage";
import MetricsPage from "../agent/MetricsPage";
import { AGENT, authFor, renderWithProviders } from "../../test/renderWithProviders";
import { indicatorOverview } from "../../test/indicatorFixtures";
import { storeToken } from "../../services/apiClient";

let requests;
beforeEach(()=>{
  requests=[];storeToken("integration-token");
  vi.stubGlobal("fetch",vi.fn(async(url,options)=>{
    requests.push({url,options});
    const data=url.includes("/overview")?indicatorOverview():url.includes("/tickets?")?{content:[{id:"recent",summary:"Una actualización reciente",currentStatus:"REGISTERED"}],totalElements:125,totalPages:32}:[];
    return{ok:true,status:200,json:async()=>data};
  }));
});
afterEach(()=>{localStorage.clear();vi.unstubAllGlobals();});
it("Dashboard → hooks → cliente HTTP usa agregados globales y sólo cuatro recientes",async()=>{
  renderWithProviders(<DashboardPage/>,{auth:authFor(AGENT)});
  await screen.findByText("125 tickets en total");
  expect(await screen.findByText("Urgente fuera de la primera página")).toBeInTheDocument();
  expect(await screen.findByText("Una actualización reciente")).toBeInTheDocument();
  expect(requests.filter(r=>r.url.includes("/tickets?")).every(r=>r.url.includes("size=4"))).toBe(true);
  expect(requests.filter(r=>r.url.includes("/overview"))).toHaveLength(1);
  expect(requests.every(r=>r.options.headers.Authorization==="Bearer integration-token")).toBe(true);
  fireEvent.click(screen.getByText("Actualizar"));await waitFor(()=>expect(requests.filter(r=>r.url.includes("/overview"))).toHaveLength(2));
});
it("Metrics → hooks → HTTP cambia filtros sin recorrer páginas de tickets",async()=>{
  renderWithProviders(<MetricsPage/>,{auth:authFor(AGENT)});await screen.findByText("Métricas de atención");
  fireEvent.click(screen.getByRole("button",{name:/Filtros/}));fireEvent.change(screen.getByLabelText("SLA"),{target:{value:"near_due"}});
  await waitFor(()=>expect(requests.some(r=>r.url.includes("sla=near_due"))).toBe(true));
  expect(requests.some(r=>r.url.includes("/tickets?"))).toBe(false);
});
it("un 403 HTTP no genera cifras ni confirma actualización",async()=>{
  fetch.mockResolvedValue({ok:false,status:403,json:async()=>({message:"FORBIDDEN"})});
  renderWithProviders(<DashboardPage/>,{auth:authFor(AGENT)});
  expect(await screen.findByRole("alert")).toHaveTextContent("permiso");expect(screen.queryByText("0 tickets en total")).not.toBeInTheDocument();
});
