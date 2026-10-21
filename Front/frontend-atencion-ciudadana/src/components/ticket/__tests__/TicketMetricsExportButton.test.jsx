import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TicketMetricsExportButton from "../TicketMetricsExportButton";
import { exportIndicatorTickets } from "../../../services/apiClient";
vi.mock("../../../services/apiClient",()=>({exportIndicatorTickets:vi.fn()}));
let click;
beforeEach(()=>{vi.clearAllMocks();URL.createObjectURL=vi.fn(()=>"blob:csv");URL.revokeObjectURL=vi.fn();click=vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});});
afterEach(()=>click.mockRestore());
it("descarga el CSV servidor con todos los filtros y bloquea duplicados",async()=>{
  let resolve;exportIndicatorTickets.mockReturnValue(new Promise(r=>{resolve=r;}));
  const filters={days:30,priority:"HIGH",sla:"breached",withoutLocation:true};render(<TicketMetricsExportButton filters={filters}/>);
  fireEvent.click(screen.getByText("Exportar"));expect(screen.getByText("Exportando…")).toBeDisabled();
  expect(exportIndicatorTickets).toHaveBeenCalledExactlyOnceWith(filters);
  await act(async()=>resolve(new Blob(["csv"])));expect(click).toHaveBeenCalledOnce();expect(URL.createObjectURL).toHaveBeenCalledOnce();
  await waitFor(()=>expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv"));
});
it.each([[401,"sesión"],[403,"permiso"],[500,"Error de red"],[undefined,"Error de red"]])("error %s no descarga un CSV ficticio",async(status,text)=>{
  exportIndicatorTickets.mockRejectedValue(Object.assign(new Error("Error de red"),{status}));render(<TicketMetricsExportButton filters={{days:7}}/>);
  fireEvent.click(screen.getByText("Exportar"));expect(await screen.findByRole("alert")).toHaveTextContent(text);expect(click).not.toHaveBeenCalled();
});
it("conserva un mensaje de error sin detalle",async()=>{
  exportIndicatorTickets.mockRejectedValue({});render(<TicketMetricsExportButton filters={{days:7}}/>);fireEvent.click(screen.getByText("Exportar"));expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos exportar");
});
it("no descarga una respuesta tardía de filtros o contexto anterior",async()=>{
  let resolve;exportIndicatorTickets.mockReturnValue(new Promise(r=>{resolve=r;}));const view=render(<TicketMetricsExportButton filters={{days:30}}/>);
  fireEvent.click(screen.getByText("Exportar"));view.unmount();await act(async()=>resolve(new Blob(["old"])));expect(click).not.toHaveBeenCalled();
});
it("no publica un error tardío después del desmontaje",async()=>{
  let reject;exportIndicatorTickets.mockReturnValue(new Promise((_,r)=>{reject=r;}));const view=render(<TicketMetricsExportButton filters={{days:30}}/>);
  fireEvent.click(screen.getByText("Exportar"));view.unmount();await act(async()=>reject(new Error()));expect(click).not.toHaveBeenCalled();
});
