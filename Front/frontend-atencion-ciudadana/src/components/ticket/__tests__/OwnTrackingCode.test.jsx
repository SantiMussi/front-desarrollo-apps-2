import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnTrackingCode from "../OwnTrackingCode";
import { AuthContext } from "../../../context/authContext";
import * as api from "../../../services/apiClient";

vi.mock("../../../services/apiClient", async (original) => ({ ...(await original()), fetchOwnTrackingCode: vi.fn() }));
const citizen = { id: "user-a", citizenId: "citizen-a", role: "CITIZEN" };
const uuid = "9345f379-c7ac-4b42-9c33-2ff376281908";
const secret = "Original-Code_123";
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { resolve, reject, promise }; };
const show = () => fireEvent.click(screen.getByRole("button", { name: "Mostrar código de seguimiento" }));
const hide = () => fireEvent.click(screen.getByRole("button", { name: "Ocultar código" }));
function mount() {
  const ui = (ticketId = uuid, user = citizen) => <AuthContext.Provider value={{ user }}><OwnTrackingCode ticketId={ticketId} /></AuthContext.Provider>;
  const view = render(ui());
  return { ...view, update: (id, user) => view.rerender(ui(id, user)) };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear(); sessionStorage.clear(); api.storeToken("session-a");
  api.fetchOwnTrackingCode.mockResolvedValue({ trackingCode: secret });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue() } });
});
afterEach(() => vi.restoreAllMocks());

describe("recuperación privada del código", () => {
  it("only fetches on demand, uses UUID, copies the exact code and forgets it on hide", async () => {
    mount();
    expect(api.fetchOwnTrackingCode).not.toHaveBeenCalled();
    show();
    expect(await screen.findByText(secret)).toBeVisible();
    expect(api.fetchOwnTrackingCode).toHaveBeenCalledWith(uuid, { signal: expect.any(AbortSignal) });
    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
    expect(await screen.findByText("Código copiado.")).toBeVisible();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(secret);
    expect(JSON.stringify(localStorage)).not.toContain(secret);
    expect(sessionStorage.length).toBe(0);
    hide();
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
    expect(screen.queryByText("Código copiado.")).not.toBeInTheDocument();
    show(); await screen.findByText(secret);
    expect(api.fetchOwnTrackingCode).toHaveBeenCalledTimes(2);
  });

  it("cancels while loading, does not duplicate and ignores late responses after hide", async () => {
    const old = deferred(), latest = deferred();
    api.fetchOwnTrackingCode.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    mount();
    const button = screen.getByRole("button", { name: "Mostrar código de seguimiento" });
    act(() => { button.click(); button.click(); });
    expect(api.fetchOwnTrackingCode).toHaveBeenCalledTimes(1);
    const signal = api.fetchOwnTrackingCode.mock.calls[0][1].signal;
    expect(screen.getByRole("status")).toHaveTextContent("Recuperando");
    hide(); expect(signal.aborted).toBe(true); show();
    await act(async () => old.resolve({ trackingCode: "STALE" }));
    expect(screen.queryByText("STALE")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Recuperando");
    await act(async () => latest.resolve({ trackingCode: secret }));
    expect(screen.getByText(secret)).toBeVisible();
  });

  it.each(["ticket", "user", "session", "logout", "storage", "unmount"])("clears visible codes and aborts on %s", async (change) => {
    const view = mount(); show(); await screen.findByText(secret);
    hide();
    const pending = deferred(); api.fetchOwnTrackingCode.mockReturnValueOnce(pending.promise);
    show(); const signal = api.fetchOwnTrackingCode.mock.calls.at(-1)[1].signal;
    const update = () => {
      if (change === "ticket") view.update("ticket-b");
      if (change === "user") view.update(uuid, { ...citizen, id: "user-b" });
      if (change === "session") { api.storeToken("session-b"); view.update(); }
      if (change === "logout") { api.removeStoredToken(); view.update(uuid, null); }
      if (change === "storage") { api.removeStoredToken(); window.dispatchEvent(new StorageEvent("storage", { key: "ciudad-uade.auth-token" })); }
      if (change === "unmount") view.unmount();
    };
    act(update);
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve({ trackingCode: secret }));
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
    if (!["logout", "storage", "unmount"].includes(change)) {
      api.fetchOwnTrackingCode.mockResolvedValueOnce({ trackingCode: secret }); show(); await screen.findByText(secret);
      act(() => {
        if (change === "ticket") view.update("ticket-c");
        if (change === "user") view.update(uuid, { ...citizen, id: "user-c" });
        if (change === "session") { api.storeToken("session-c"); view.update(); }
      });
      expect(screen.queryByText(secret)).not.toBeInTheDocument();
    }
  });

  it.each([400, 401, 403, 404, 409, 503, undefined])("shows safe Spanish errors for %s and permits retry", async (status) => {
    api.fetchOwnTrackingCode.mockRejectedValueOnce(Object.assign(new Error(secret), { status }));
    mount(); show();
    const alert = await screen.findByRole("alert");
    const text = { 400: /identificar/, 401: /sesión/, 403: /acceso/, 404: /acceso/, 409: /anterior a esta función/, 503: /por el momento/ };
    expect(alert).toHaveTextContent(text[status] || /Intentá de nuevo/);
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
    show(); expect(await screen.findByText(secret)).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([null, {}, { trackingCode: "" }, { trackingCode: 123 }, { trackingCode: "  " }])("rejects malformed success %j", async (response) => {
    api.fetchOwnTrackingCode.mockResolvedValueOnce(response); mount(); show();
    expect(await screen.findByRole("alert")).toHaveTextContent(/No pudimos recuperar/);
    expect(screen.queryByRole("button", { name: "Copiar código" })).not.toBeInTheDocument();
  });

  it.each(["denied", "unavailable"])("handles clipboard %s without exposing the exception", async (mode) => {
    mount(); show(); await screen.findByText(secret);
    if (mode === "denied") navigator.clipboard.writeText.mockRejectedValueOnce(new Error(secret));
    else Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/copiarlo manualmente/);
  });

  it("discards late clipboard feedback after hiding and prevents duplicate copies", async () => {
    const pending = deferred(); navigator.clipboard.writeText.mockReturnValue(pending.promise);
    mount(); show(); await screen.findByText(secret);
    const button = screen.getByRole("button", { name: "Copiar código" });
    act(() => { button.click(); button.click(); });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    hide(); await act(async () => pending.reject(new Error(secret)));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
  });

  it("ignores success when token changes without a context render", async () => {
    const pending = deferred(); api.fetchOwnTrackingCode.mockReturnValue(pending.promise);
    mount(); show(); api.storeToken("another-session");
    await act(async () => pending.resolve({ trackingCode: secret }));
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
  });

  it.each(["logout", "storage"])("removes an already visible code on %s and does not restore it on login", async (change) => {
    const view = mount(); show(); await screen.findByText(secret);
    act(() => {
      api.removeStoredToken();
      if (change === "logout") view.update(uuid, null);
      else window.dispatchEvent(new StorageEvent("storage", { key: "ciudad-uade.auth-token" }));
    });
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
    api.storeToken("session-a"); view.update();
    expect(screen.queryByText(secret)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar código de seguimiento" })).toBeVisible();
    expect(api.fetchOwnTrackingCode).toHaveBeenCalledTimes(1);
  });

  it("discards late errors after unmount", async () => {
    const pending = deferred(); api.fetchOwnTrackingCode.mockReturnValueOnce(pending.promise);
    const view = mount(); show(); view.unmount();
    await act(async () => pending.reject(Object.assign(new Error(secret), { status: 503 })));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([null, { ...citizen, role: "AGENT" }])("does not offer recovery without a citizen identity", (user) => {
    const view = mount(); view.update(uuid, user);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
