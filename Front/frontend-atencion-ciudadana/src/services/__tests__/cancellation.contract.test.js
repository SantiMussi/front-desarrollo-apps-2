import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as api from "../apiClient";

beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] })); });
afterEach(() => vi.unstubAllGlobals());
const create = { reasonCode: "WITHDRAWN_BY_CITIZEN", reason: "Retiro mi reclamo" };
const approve = { cancellationScope: "PRINCIPAL_ONLY", decisionReason: "Afecta al principal", publicMessage: "Seguimos atendiendo" };
it.each([
  ["createCancellationRequest", ["a/b", create], "POST", "/tickets/a%2Fb/cancellation-requests", create],
  ["fetchCancellationRequests", ["a/b"], undefined, "/tickets/a%2Fb/cancellation-requests"],
  ["createAnonymousCancellationRequest", ["code", "secret", create], "POST", "/tracking/actions/cancellation-requests", { trackingCode: "code", anonymousAccessPassword: "secret", payload: create }],
  ["fetchAnonymousCancellationRequests", ["code", "secret"], "POST", "/tracking/actions/cancellation-requests/history", { trackingCode: "code", anonymousAccessPassword: "secret" }],
  ["fetchStaffCancellationRequests", ["a/b"], undefined, "/staff/tickets/a%2Fb/cancellation-requests"],
  ["fetchStaffCancellationRequest", ["a/b", "c/d"], undefined, "/staff/tickets/a%2Fb/cancellation-requests/c%2Fd"],
  ["approveCancellationRequest", ["a/b", "c/d", approve], "POST", "/staff/tickets/a%2Fb/cancellation-requests/c%2Fd/approve", approve],
  ["rejectCancellationRequest", ["a/b", "c/d", { decisionReason: "Vigente" }], "POST", "/staff/tickets/a%2Fb/cancellation-requests/c%2Fd/reject", { decisionReason: "Vigente" }],
  ["fetchCancellationConflicts", ["a/b"], undefined, "/staff/tickets/a%2Fb/cancellation-conflicts"],
  ["resolveCancellationConflict", ["a/b", 123, { decision: "APPROVED", ...approve }], "POST", "/staff/tickets/a%2Fb/cancellation-conflicts/123/resolve", { decision: "APPROVED", ...approve }],
  ["cancelTicket", ["a/b", { reasonCode: "OTHER", ...approve }], "POST", "/tickets/a%2Fb/cancel", { reasonCode: "OTHER", publicMessage: "Seguimos atendiendo", internalMessage: null, ...approve }],
])("contrato H05 %s", async (name, args, method, path, body) => {
  await api[name](...args);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(`/api${path}`);
  expect(options.method).toBe(method);
  expect(options.body && JSON.parse(options.body)).toEqual(body);
  if (path.startsWith("/tracking")) { expect(url).not.toContain("secret"); expect(options.cache).toBe("no-store"); }
});
it.each([400, 401, 403, 404, 409, 410])("conserva HTTP y código %s sin asumir éxito", async (status) => {
  fetch.mockResolvedValue({ ok: false, status, json: async () => ({ code: "TICKET_STATE_CONFLICT", message: "Estado incompatible" }) });
  await expect(api.approveCancellationRequest("ticket", "request", approve)).rejects.toMatchObject({ status, code: "TICKET_STATE_CONFLICT" });
});
