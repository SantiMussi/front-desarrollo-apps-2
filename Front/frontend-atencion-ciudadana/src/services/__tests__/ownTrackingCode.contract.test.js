import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchMyTickets, fetchMyTicketDetail, fetchOwnTrackingCode, storeToken } from "../apiClient";

beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => vi.unstubAllGlobals());

it("uses the private UUID endpoint, existing Bearer, no-store and AbortSignal", async () => {
  storeToken("existing-token");
  const controller = new AbortController();
  fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ trackingCode: "EXACT_original" }) });
  await expect(fetchOwnTrackingCode("internal/uuid", { signal: controller.signal })).resolves.toEqual({ trackingCode: "EXACT_original" });
  expect(fetch).toHaveBeenCalledWith("/api/me/tickets/internal%2Fuuid/tracking-code", expect.objectContaining({
    cache: "no-store", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer existing-token" },
  }));
  expect(localStorage.length).toBe(1);
});

it.each([400, 401, 404, 409, 503])("preserves HTTP %s for the UI", async (status) => {
  fetch.mockResolvedValue({ ok: false, status, json: async () => ({ message: "Unavailable" }) });
  await expect(fetchOwnTrackingCode("uuid")).rejects.toMatchObject({ status });
});

it("propagates cancellation", async () => {
  const controller = new AbortController(); controller.abort();
  fetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));
  await expect(fetchOwnTrackingCode("uuid", { signal: controller.signal })).rejects.toHaveProperty("name", "AbortError");
});

it("forwards AbortSignal and existing Bearer through list and detail requests", async () => {
  storeToken("existing-token");
  const controller = new AbortController();
  fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  await fetchMyTickets({ size: 200, page: 1 }, { signal: controller.signal });
  await fetchMyTicketDetail("internal/uuid", { signal: controller.signal });
  expect(fetch.mock.calls.map(([url]) => url)).toEqual(["/api/me/tickets?size=200&page=1", "/api/tickets/internal%2Fuuid"]);
  for (const [, options] of fetch.mock.calls) {
    expect(options.signal).toBe(controller.signal);
    expect(options.headers.Authorization).toBe("Bearer existing-token");
  }
});
