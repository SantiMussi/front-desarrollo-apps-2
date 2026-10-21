// Real page, hooks and apiClient; HTTP is the only mocked boundary.
import { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthContext } from "../../context/authContext";
import { authFor } from "../../test/renderWithProviders";
import TicketDetailPage from "../agent/TicketDetailPage";
import { storeToken } from "../../services/apiClient";

const reply = (body, status=200) => ({ ok: status<400, status, json: async () => body });
const detail = (id) => ({ id, publicId: `TK-${id}`, summary: `Ticket ${id}`, description: `Private ${id}`,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", currentStatus: "ROUTED", currentPriority: "LOW", responsibleAreaId: "M6", attachments: [], ticketActivities: [],
  formData: { flag: false, count: 0 }, currentProgress: 25, location: { addressLine: "Dirección sin mapa" } });
const deferred = () => { let resolve; const promise=new Promise((r) => { resolve=r; }); return { promise, resolve }; };
let handler;
let requests;
beforeEach(() => {
  localStorage.clear();storeToken("area-token");requests=[];
  handler=async (url) => {
    if(url==="/api/catalog/categories") return reply([]);
    if(url.endsWith("/messages")) return reply([]);
    if(url.startsWith("/api/tickets/")) return reply({message:"Not owner"},403);
    if(url.startsWith("/api/staff/tickets/")) return reply(detail(url.split("/").at(-1)));
    throw new Error(`Unexpected HTTP ${url}`);
  };
  vi.stubGlobal("fetch",vi.fn((url,options) => {requests.push([url,options]);return handler(url,options);}));
});
afterEach(() => {vi.unstubAllGlobals();localStorage.clear();});
function Controls() {
  const navigate=useNavigate();
  return <button onClick={() => navigate("/agente/tickets/b")}>Otro ticket</button>;
}
function Session() {
  const [area,setArea]=useState("M6");
  return <AuthContext.Provider value={authFor({role:"AREA_RESPONSIBLE",citizenId:"area",areaId:area})}>
    <button onClick={() => setArea("M9")}>Cambiar área</button>
    <MemoryRouter initialEntries={["/agente/tickets/a"]}><Controls /><Routes>
      <Route path="/agente/tickets/:ticketId" element={<TicketDetailPage />} />
    </Routes></MemoryRouter>
  </AuthContext.Provider>;
}
it("area flow reads confirmed facts and creates PUBLIC/INTERNAL with no admin requests", async () => {
  const sent=[];
  const base=handler;
  handler=async(url,options) => {
    if(url.endsWith("/messages") && options.method==="POST") {
      const body=JSON.parse(options.body);sent.push(body);
      return reply({id:sent.length,...body,authorType:"AREA_RESPONSIBLE",authorId:"area",createdAt:"2026-01-01T00:00:00Z"},201);
    }
    return base(url,options);
  };
  render(<Session />);
  await screen.findByText("Private a");
  const textarea=await screen.findByPlaceholderText("Escribe un comentario o respuesta...");
  fireEvent.change(textarea,{target:{value:"Público"}});fireEvent.click(screen.getByRole("button",{name:"Enviar"}));
  await waitFor(() => expect(sent).toHaveLength(1));
  await waitFor(() => expect(screen.getByPlaceholderText("Escribe un comentario o respuesta...")).toHaveValue(""));
  fireEvent.click(screen.getByRole("button",{name:"Nota interna"}));
  fireEvent.change(screen.getByPlaceholderText("Agrega una nota para el equipo..."),{target:{value:"Interno"}});
  fireEvent.click(screen.getByRole("button",{name:"Enviar"}));
  await waitFor(() => expect(sent).toEqual([{visibility:"PUBLIC",text:"Público"},{visibility:"INTERNAL",text:"Interno"}]));
  expect(screen.getByText("25%")).toBeInTheDocument();expect(screen.getByText("Dirección sin mapa")).toBeInTheDocument();
  expect(screen.getByLabelText("Prioridad")).toHaveTextContent("Calculada por el sistema");
  expect(requests.some(([url]) => /reclassification|cancellation|staff\/labels|simulate/.test(url))).toBe(false);
});
it("clears drafts and private facts on ticket change and ignores late detail/messages", async () => {
  const pending=deferred(), lateMessages=deferred();const base=handler;
  handler=(url,options) => url==="/api/staff/tickets/a" ? pending.promise : url==="/api/tickets/a/messages" ? lateMessages.promise : base(url,options);
  render(<Session />);fireEvent.click(screen.getByRole("button",{name:"Otro ticket"}));
  await screen.findByText("Private b");
  await act(async () => {pending.resolve(reply(detail("a")));lateMessages.resolve(reply([{id:1,text:"Private old message",createdAt:"2026-01-01",authorType:"AREA_RESPONSIBLE"}]));});
  expect(screen.queryByText("Private a")).not.toBeInTheDocument();expect(screen.queryByText("Private old message")).not.toBeInTheDocument();
  expect(screen.getByText("Private b")).toBeInTheDocument();
});
it("a changed authenticated area hides previous content while a denied refresh is pending", async () => {
  render(<Session />);await screen.findByText("Private a");
  const textarea=await screen.findByPlaceholderText("Escribe un comentario o respuesta...");
  fireEvent.change(textarea,{target:{value:"Private draft"}});
  const denied=deferred();const base=handler;
  handler=(url,options) => url==="/api/staff/tickets/a" ? denied.promise : base(url,options);
  fireEvent.click(screen.getByRole("button",{name:"Cambiar área"}));
  expect(screen.queryByText("Private a")).not.toBeInTheDocument();expect(screen.queryByDisplayValue("Private draft")).not.toBeInTheDocument();
  await act(async () => denied.resolve(reply({message:"Forbidden"},403)));
  await screen.findByText("No tenés acceso a este ticket");
  expect(screen.queryByText("Private a")).not.toBeInTheDocument();
});

