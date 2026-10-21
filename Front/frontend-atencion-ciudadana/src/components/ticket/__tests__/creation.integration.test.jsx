// React + real hooks + real apiClient; only the HTTP boundary and map are mocked.
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TicketForm from "../TicketForm";
import { CITIZEN, authFor, makeAuth, renderWithProviders } from "../../../test/renderWithProviders";
import { storeToken } from "../../../services/apiClient";

vi.mock("../../ui/LocationMap", () => ({ default: ({ onLocationSelect }) => <button type="button" onClick={() => onLocationSelect({ lat: 0, lng: 0, source: "map", neighborhoods: ["Inventado"] })}>Elegir origen</button> }));
const type = { id: 12, name: "Prueba", requiresLocation: false, allowsAnonymous: true };
const response = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
let createResponse;
let requests;
beforeEach(() => {
  requests = [];
  localStorage.clear();
  createResponse = () => response({ trackingCode: "TRACK-OK" }, 201);
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    if (url === "/api/catalog/neighborhoods") return response([]);
    if (url.endsWith("/form")) return response({ fields: [] });
    if (url === "/api/tickets") { requests.push(options); return createResponse(); }
    throw new Error(`Unexpected HTTP request: ${url}`);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });
async function setup(overrides = {}, anonymous = false) {
  storeToken("identified-token");
  const view = renderWithProviders(<TicketForm requestType={{ ...type, ...overrides }} />, { auth: anonymous ? makeAuth() : authFor(CITIZEN) });
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Reporte de prueba" } });
  fireEvent.change(screen.getByLabelText(/Descripción detallada/), { target: { value: "Descripción que debe conservarse" } });
  return view;
}
const send = () => fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
describe("H18 creation through React, hooks and HTTP client (mock HTTP)", () => {
  it("identified creation sends null optional location and Authorization", async () => {
    await setup(); send();
    await screen.findByText("TRACK-OK");
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer identified-token" } });
    expect(JSON.parse(requests[0].body)).toMatchObject({ requestTypeId: 12, location: null, formData: {} });
  });
  it("manual address enables creation without map/geocoding, even with no neighborhood catalog", async () => {
    await setup({ requiresLocation: true });
    expect(screen.getByRole("button", { name: /Enviar solicitud/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Calle/), { target: { value: "Plaza central" } });
    send(); await screen.findByText("TRACK-OK");
    expect(JSON.parse(requests[0].body).location).toMatchObject({ addressLine: "Plaza central", neighborhoodId: null, latitude: null, longitude: null });
  });
  it("zero coordinates suffice and never select a neighborhood", async () => {
    await setup({ requiresLocation: true });
    fireEvent.click(screen.getByRole("button", { name: "Elegir origen" }));
    send(); await screen.findByText("TRACK-OK");
    expect(JSON.parse(requests[0].body).location).toMatchObject({ latitude: 0, longitude: 0, neighborhoodId: null });
  });
  it("dynamic false, zero, configured SELECT and explicit unknown retain JSON types", async () => {
    await setup({ specificFields: [
      { code: "FLAG", label: "Bandera", type: "BOOLEAN", required: true },
      { code: "COUNT", label: "Cantidad", type: "NUMBER", required: true },
      { code: "CHOICE", label: "Opción", type: "SELECT", required: true, config: { options: [{ value: "ok", label: "Correcta" }] } },
      { code: "UNKNOWN", label: "Desconocido", type: "DATE", required: true, allowUnknown: true },
      { code: "OPTIONAL", label: "Opcional", type: "TEXT" },
    ] });
    fireEvent.click(screen.getByRole("button", { name: "No", exact: true }));
    fireEvent.change(screen.getByLabelText(/Cantidad/), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(/Opción/), { target: { value: "ok" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /No sé/ }));
    send(); await screen.findByText("TRACK-OK");
    expect(JSON.parse(requests[0].body).formData).toEqual({ FLAG: false, COUNT: 0, CHOICE: "ok", UNKNOWN: null });
  });
  it("anonymous multipart creation omits stored auth and uses evidence/data parts", async () => {
    const { container } = await setup({}, true);
    fireEvent.click(screen.getByRole("switch"));
    const file = new File(["synthetic content; backend verifies magic bytes"], "proof.heic", { type: "image/heic" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    send(); await screen.findByText("TRACK-OK");
    expect(requests[0].headers).toEqual({});
    expect(requests[0].body.getAll("evidence")).toHaveLength(1);
    expect(requests[0].body.get("data").type).toBe("application/json");
  });
  it("accepts decimal NUMBER without the browser's default integer step overriding the schema", async () => {
    await setup({ specificFields: [{ code: "COUNT", label: "Cantidad", type: "NUMBER", required: true, config: { min: 0, max: 1 } }] });
    fireEvent.change(screen.getByLabelText(/Cantidad/), { target: { value: "0.5" } });
    const form = screen.getByRole("button", { name: /Enviar solicitud/ }).closest("form");
    expect(form.noValidate).toBe(true);
    send(); await screen.findByText("TRACK-OK");
    expect(JSON.parse(requests[0].body).formData).toEqual({ COUNT: 0.5 });
  });
  it.each([400, 401, 403, 409, 422])("HTTP %i preserves the draft and does not announce success", async (status) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createResponse = () => response({ message: `Rechazo ${status}` }, status);
    await setup(); send();
    await screen.findByText(`Rechazo ${status}`);
    expect(screen.queryByText("¡Reclamo Registrado!")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toHaveValue("Reporte de prueba");
    expect(screen.getByLabelText(/Descripción detallada/)).toHaveValue("Descripción que debe conservarse");
  });
  it("rejects unsupported files, keeps accepted files and allows correcting selection", async () => {
    const { container } = await setup();
    const input = container.querySelector('input[type="file"]');
    expect(input.accept).toBe("image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf");
    fireEvent.change(input, { target: { files: [new File(["doc"], "bad.doc", { type: "application/msword" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent(/Formato no admitido/);
    expect(screen.queryByText("bad.doc")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { files: [new File(["pdf"], "ok.pdf", { type: "application/pdf" })] } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("ok.pdf")).toBeInTheDocument();
  });
  it("repeated submit while HTTP is pending produces one mutation and no early success", async () => {
    let resolve;
    createResponse = () => new Promise((done) => { resolve = done; });
    await setup();
    const form = screen.getByRole("button", { name: /Enviar solicitud/ }).closest("form");
    fireEvent.submit(form); fireEvent.submit(form);
    expect(requests).toHaveLength(1);
    expect(screen.queryByText("¡Reclamo Registrado!")).not.toBeInTheDocument();
    await act(async () => resolve(response({ trackingCode: "TRACK-OK" }, 201)));
    await screen.findByText("TRACK-OK");
  });
});
