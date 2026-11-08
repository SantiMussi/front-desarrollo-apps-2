import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useMyTicketDetail } from "../useMyTicketDetail";
import { removeStoredToken, storeToken } from "../../services/apiClient";

const ticket = { id: "uuid", publicId: "TK-1", summary: "Sesión actual" };
const response = (body) => ({ ok: true, status: 200, json: async () => body });
const page = (content = [ticket], extra = {}) => response({ content, last: true, ...extra });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const lists = () => fetch.mock.calls.filter(([url]) => url.startsWith("/api/me/tickets?"));
function changeToken(token) {
  if (token) storeToken(token); else removeStoredToken();
  window.dispatchEvent(new StorageEvent("storage", { key: "ciudad-uade.auth-token" }));
}

beforeEach(() => {
  localStorage.clear(); storeToken("A");
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (url.startsWith("/api/me/tickets?")) return page();
    if (url === "/api/tickets/uuid") return response(ticket);
    return response([]);
  }));
});
afterEach(() => vi.unstubAllGlobals());

it.each(["list", "page2", "detail"].flatMap((stage) => ["success", "error"].map((outcome) => [stage, outcome])))("discards old %s %s after a token change, even when abort is ignored", async (stage, outcome) => {
    const pending = deferred();
    const target = stage === "detail" ? "/api/tickets/uuid" : stage === "page2" ? "/api/me/tickets?size=200&page=1" : "/api/me/tickets?size=200";
    fetch.mockImplementation(async (url, options) => {
      if (options.headers.Authorization === "Bearer A") {
        if (url === target) return pending.promise;
        if (stage === "page2" && url.startsWith("/api/me/tickets?")) return page([{ publicId: "OTHER" }], { last: false, totalPages: 2 });
      }
      if (url.startsWith("/api/me/tickets?")) return page();
      if (url === "/api/tickets/uuid") return response(ticket);
      return response([]);
    });
    const { result } = renderHook(() => useMyTicketDetail("TK-1"));
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => url === target)).toBe(true));
    const signal = fetch.mock.calls.find(([url]) => url === target)[1].signal;
    act(() => changeToken("B"));
    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(result.current.ticket?.summary).toBe("Sesión actual"));
    const before = fetch.mock.calls.length;
    await act(async () => {
      if (outcome === "error") pending.reject(Object.assign(new Error("Sesión anterior"), { status: 401 }));
      else pending.resolve(stage === "detail" ? response({ ...ticket, summary: "DATO ANTERIOR" }) : page([{ ...ticket, summary: "DATO ANTERIOR" }], { last: false, totalPages: 3 }));
    });
    expect(result.current.ticket.summary).toBe("Sesión actual");
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(before);
    expect(lists().filter(([, options]) => options.headers.Authorization === "Bearer B").map(([url]) => url)).toEqual(["/api/me/tickets?size=200"]);
  });

it("checks the real token before advancing pagination, even before the storage event", async () => {
  const pending = deferred(); fetch.mockReturnValueOnce(pending.promise);
  const { result } = renderHook(() => useMyTicketDetail("TK-1"));
  storeToken("B");
  await act(async () => pending.resolve(page([{ publicId: "OTHER" }], { last: false, totalPages: 2 })));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.current.ticket).toBeNull();
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "ciudad-uade.auth-token" })));
  await waitFor(() => expect(result.current.ticket?.id).toBe("uuid"));
  expect(lists().map(([url]) => url)).toEqual(["/api/me/tickets?size=200", "/api/me/tickets?size=200"]);
});

it("logout aborts a pending detail and does not load with missing credentials", async () => {
  const pending = deferred();
  const base = fetch.getMockImplementation();
  fetch.mockImplementation((url, options) => url === "/api/tickets/uuid" ? pending.promise : base(url, options));
  const { result } = renderHook(() => useMyTicketDetail("TK-1"));
  await waitFor(() => expect(fetch.mock.calls.some(([url]) => url === "/api/tickets/uuid")).toBe(true));
  const signal = fetch.mock.calls.find(([url]) => url === "/api/tickets/uuid")[1].signal;
  const before = fetch.mock.calls.length;
  act(() => changeToken(null));
  expect(result.current).toMatchObject({ ticket: null, loading: false, error: null });
  expect(signal.aborted).toBe(true);
  await act(async () => pending.resolve(response({ ...ticket, summary: "ANOTHER SESSION" })));
  expect(fetch).toHaveBeenCalledTimes(before);
  expect(result.current.ticket).toBeNull();
});

it("hides the previous detail immediately when the token changes in the same tab", async () => {
  const { result, rerender } = renderHook(() => useMyTicketDetail("TK-1"));
  await waitFor(() => expect(result.current.ticket?.id).toBe("uuid"));
  const pending = deferred(); fetch.mockReturnValueOnce(pending.promise);
  storeToken("B"); rerender();
  expect(result.current.ticket).toBeNull();
  expect(result.current.loading).toBe(true);
  await act(async () => pending.resolve(page()));
  await waitFor(() => expect(result.current.ticket?.id).toBe("uuid"));
  expect(lists()).toHaveLength(2);
});

it("unmount aborts and discards a late load", async () => {
  const pending = deferred(); fetch.mockReturnValueOnce(pending.promise);
  const { result, unmount } = renderHook(() => useMyTicketDetail("TK-1"));
  const signal = fetch.mock.calls[0][1].signal;
  unmount(); expect(signal.aborted).toBe(true);
  await act(async () => pending.resolve(page()));
  expect(result.current.ticket).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("stable renders and unrelated storage events do not reload; explicit reload still works", async () => {
  const { result, rerender } = renderHook(() => useMyTicketDetail("TK-1"));
  await waitFor(() => expect(result.current.ticket?.id).toBe("uuid"));
  rerender();
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" })));
  expect(lists()).toHaveLength(1);
  await act(async () => result.current.reload());
  expect(lists()).toHaveLength(2);
});

it("a newer reload aborts the older one and ignores its late response", async () => {
  const { result } = renderHook(() => useMyTicketDetail("TK-1"));
  await waitFor(() => expect(result.current.ticket?.id).toBe("uuid"));
  const old = deferred(); fetch.mockReturnValueOnce(old.promise);
  let oldTask;
  act(() => { oldTask = result.current.reload(); });
  const signal = lists().at(-1)[1].signal;
  await act(async () => result.current.reload());
  expect(signal.aborted).toBe(true);
  await act(async () => { old.resolve(page([{ publicId: "OLD" }], { last: false })); await oldTask; });
  expect(result.current.ticket.summary).toBe(ticket.summary);
  expect(lists()).toHaveLength(3);
});
