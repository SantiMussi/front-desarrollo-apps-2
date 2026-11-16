import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MisReclamoDetailPage from "../citizen/MisReclamoDetailPage";
import CitizenTicketView from "../../components/ticket/CitizenTicketView";
import OwnTrackingCode from "../../components/ticket/OwnTrackingCode";
import { CITIZEN, authFor, renderWithProviders } from "../../test/renderWithProviders";
import { removeStoredToken, storeToken } from "../../services/apiClient";
import { AuthContext } from "../../context/authContext";

const old = { id: "ce08c8a5-2a71-40ec-a5bf-86e357cfaf77", publicId: "OP-201", summary: "Reclamo anterior", currentStatus: "REGISTERED", history: [] };
const recent = { ...old, id: "259908ed-a0db-41a8-b368-6c5b86809048", publicId: "OP-1", summary: "Reclamo reciente" };
const recoveryCalls = () => fetch.mock.calls.filter(([url]) => url.endsWith("/tracking-code"));
const detail = () => renderWithProviders(<><Link to="/mis-reclamos/OP-1">Otro reclamo</Link><MisReclamoDetailPage /></>, {
  route: "/mis-reclamos/OP-201", path: "/mis-reclamos/:publicId", auth: authFor(CITIZEN),
});
function sessionDetail() {
  const ui = (user) => <AuthContext.Provider value={authFor(user)}>
    <MemoryRouter initialEntries={["/mis-reclamos/OP-201"]}><Routes>
      <Route path="/mis-reclamos/:publicId" element={<MisReclamoDetailPage />} />
    </Routes></MemoryRouter>
  </AuthContext.Provider>;
  const view = render(ui(CITIZEN));
  return { ...view, setUser: (user) => view.rerender(ui(user)) };
}

beforeEach(() => {
  localStorage.clear(); storeToken("citizen-session");
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    let body = [];
    if (url === "/api/me/tickets?size=200") body = { content: [recent], totalPages: 2, last: false };
    else if (url === "/api/me/tickets?size=200&page=1") body = { content: [old], totalPages: 2, last: true };
    else if (url === `/api/tickets/${old.id}`) body = old;
    else if (url === `/api/tickets/${recent.id}`) body = recent;
    else if (url.endsWith("/tracking-code")) body = { trackingCode: "SAME-ORIGINAL-CODE" };
    else if (!url.endsWith("/messages") && !url.endsWith("/cancellation-requests")) throw new Error(`Unexpected fixture request: ${url}`);
    return { ok: true, status: 200, json: async () => body };
  }));
});
afterEach(() => vi.unstubAllGlobals());

it("resolves a direct link past the first page, recovers with UUID and existing Bearer, and works on reload", async () => {
  let view = detail();
  await screen.findByRole("heading", { name: old.summary });
  expect(fetch).toHaveBeenCalledWith("/api/me/tickets?size=200&page=1", expect.anything());
  expect(recoveryCalls()).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Mostrar código de seguimiento" }));
  expect(await screen.findByText("SAME-ORIGINAL-CODE")).toBeVisible();
  expect(recoveryCalls()).toEqual([[`/api/me/tickets/${old.id}/tracking-code`, expect.objectContaining({
    cache: "no-store", signal: expect.any(AbortSignal), headers: expect.objectContaining({ Authorization: "Bearer citizen-session" }),
  })]]);
  view.unmount(); view = detail();
  await screen.findByRole("heading", { name: old.summary });
  expect(screen.queryByText("SAME-ORIGINAL-CODE")).not.toBeInTheDocument();
  expect(recoveryCalls()).toHaveLength(1);
  view.unmount();
});

it("navigation aborts a request and cannot show the old code in the new ticket", async () => {
  const implementation = fetch.getMockImplementation();
  let resolve;
  fetch.mockImplementation((url, options) => url.endsWith("/tracking-code")
    ? new Promise((done) => { resolve = done; }) : implementation(url, options));
  detail(); await screen.findByRole("heading", { name: old.summary });
  fireEvent.click(screen.getByRole("button", { name: "Mostrar código de seguimiento" }));
  const signal = recoveryCalls()[0][1].signal;
  fireEvent.click(screen.getByRole("link", { name: "Otro reclamo" }));
  await screen.findByRole("heading", { name: recent.summary });
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ ok: true, status: 200, json: async () => ({ trackingCode: "STALE-CODE" }) }));
  expect(screen.queryByText("STALE-CODE")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Mostrar código de seguimiento" })).toBeVisible();
});

it.each([false, true])("shared anonymous/staff views do not acquire recovery controls (readOnly=%s)", (readOnly) => {
  renderWithProviders(<CitizenTicketView ticket={old} readOnly={readOnly}
    {...(readOnly ? { trackingCodeControl: <OwnTrackingCode ticketId={old.id} /> } : {})} />, { auth: authFor(CITIZEN) });
  expect(screen.queryByRole("button", { name: "Mostrar código de seguimiento" })).not.toBeInTheDocument();
  expect(recoveryCalls()).toHaveLength(0);
});

it.each(["identity", "citizenId", "token", "logout", "storage-token", "storage-logout"])("removes the complete previous detail and displayed tracking code on %s", async (change) => {
    const view = sessionDetail();
    await screen.findByRole("heading", { name: old.summary });
    fireEvent.click(screen.getByRole("button", { name: "Mostrar código de seguimiento" }));
    await screen.findByText("SAME-ORIGINAL-CODE");
    const oldSignal = fetch.mock.calls.find(([url]) => url === `/api/tickets/${old.id}`)[1].signal;
    const base = fetch.getMockImplementation();
    let finishNewList;
    fetch.mockImplementation((url, options) => url.startsWith("/api/me/tickets?")
      ? new Promise((resolve) => { finishNewList = resolve; }) : base(url, options));
    const before = fetch.mock.calls.length;
    act(() => {
      if (change === "identity") view.setUser({ ...CITIZEN, id: "user-B" });
      if (change === "citizenId") view.setUser({ ...CITIZEN, citizenId: "citizen-B" });
      if (change === "token") { storeToken("session-B"); view.setUser(CITIZEN); }
      if (change === "logout") { removeStoredToken(); view.setUser(null); }
      if (change.startsWith("storage-")) {
        if (change === "storage-token") storeToken("session-B"); else removeStoredToken();
        window.dispatchEvent(new StorageEvent("storage", { key: "ciudad-uade.auth-token" }));
      }
    });
    expect(screen.queryByRole("heading", { name: old.summary })).not.toBeInTheDocument();
    expect(screen.queryByText("SAME-ORIGINAL-CODE")).not.toBeInTheDocument();
    expect(oldSignal.aborted).toBe(true);
    if (change.includes("logout")) expect(fetch).toHaveBeenCalledTimes(before);
    else {
      expect(fetch).toHaveBeenCalledTimes(before + 1);
      await act(async () => finishNewList({ ok: true, status: 200, json: async () => ({ content: [], last: true }) }));
      await screen.findByText("No encontramos este reclamo.");
    }
    expect(recoveryCalls()).toHaveLength(1);
  });

it.each(["success", "error"])("a late detail %s from user A is rejected after identity changes with the same URL and token", async (outcome) => {
  const base = fetch.getMockImplementation();
  let finish, fail;
  fetch.mockImplementation((url, options) => url === `/api/tickets/${old.id}`
    ? new Promise((resolve, reject) => { finish = resolve; fail = reject; }) : base(url, options));
  const view = sessionDetail();
  await waitFor(() => expect(finish).toBeDefined());
  const signal = fetch.mock.calls.find(([url]) => url === `/api/tickets/${old.id}`)[1].signal;
  fetch.mockImplementation(async () => ({ ok: true, status: 200, json: async () => ({ content: [], last: true }) }));
  view.setUser({ ...CITIZEN, id: "B" });
  expect(signal.aborted).toBe(true);
  await screen.findByText("No encontramos este reclamo.");
  await act(async () => {
    if (outcome === "success") finish({ ok: true, status: 200, json: async () => old });
    else fail(Object.assign(new Error("Old session"), { status: 401 }));
  });
  expect(screen.queryByRole("heading", { name: old.summary })).not.toBeInTheDocument();
  expect(screen.getByText("No encontramos este reclamo.")).toBeVisible();
});

it("a late recovered code cannot reappear after changing the detail identity", async () => {
  const base = fetch.getMockImplementation();
  let finishCode;
  fetch.mockImplementation((url, options) => url.endsWith("/tracking-code")
    ? new Promise((resolve) => { finishCode = resolve; }) : base(url, options));
  const view = sessionDetail();
  await screen.findByRole("heading", { name: old.summary });
  fireEvent.click(screen.getByRole("button", { name: "Mostrar código de seguimiento" }));
  const signal = recoveryCalls()[0][1].signal;
  view.setUser({ ...CITIZEN, id: "B" });
  expect(signal.aborted).toBe(true);
  await screen.findByRole("heading", { name: old.summary });
  await act(async () => finishCode({ ok: true, status: 200, json: async () => ({ trackingCode: "STALE-RECOVERY" }) }));
  expect(screen.queryByText("STALE-RECOVERY")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Mostrar código de seguimiento" })).toBeVisible();
});

it("refreshing the user object without changing identity or token does not reload the detail", async () => {
  const view = sessionDetail();
  await screen.findByRole("heading", { name: old.summary });
  const before = fetch.mock.calls.length;
  view.setUser({ ...CITIZEN, displayName: "Nombre actualizado" });
  expect(screen.getByRole("heading", { name: old.summary })).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(before);
});
