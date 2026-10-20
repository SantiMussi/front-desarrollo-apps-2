import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as api from "../apiClient";

beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })); });
afterEach(() => vi.unstubAllGlobals());
const readBlob = (blob) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(JSON.parse(reader.result)); reader.readAsText(blob); });

it.each([
  ["proposeTicketReclassification", ["a/b", { requestTypeId: 2, formData: { zero: 0 } }], "POST", "/a%2Fb/reclassification-proposals", { requestTypeId: 2, formData: { zero: 0 } }],
  ["fetchReclassificationProposals", ["a/b"], undefined, "/a%2Fb/reclassification-proposals"],
  ["fetchReclassificationProposal", ["a/b", 7], undefined, "/a%2Fb/reclassification-proposals/7"],
  ["confirmReclassificationProposal", ["a/b", 7], "POST", "/a%2Fb/reclassification-proposals/7/confirm"],
  ["abandonReclassificationProposal", ["a/b", 7, "Motivo"], "POST", "/a%2Fb/reclassification-proposals/7/abandon", { reason: "Motivo" }],
])("contrato staff %s", async (name, args, method, path, body) => {
  api.storeToken("staff-token");
  await api[name](...args);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(`/api/staff/tickets${path}`);
  expect(options.method).toBe(method);
  expect(options.body ? JSON.parse(options.body) : undefined).toEqual(body);
  expect(options.headers.Authorization).toBe("Bearer staff-token");
});

it.each([false, true])("respuesta identificada/anónima JSON y multipart (anonymous=%s)", async (anonymous) => {
  const data = { responseMessage: null, formData: { zero: 0, no: false, unknown: null }, location: { latitude: 0, longitude: 0 } };
  const envelope = anonymous ? { trackingCode: "tracking", anonymousAccessPassword: "password", payload: data } : data;
  api.storeToken("citizen-token");
  for (const attachments of [[], [new File(["evidence"], "evidence.png", { type: "image/png" })]]) {
    if (anonymous) await api.answerAnonymousInformation("tracking", { ticketPassword: "password", ...data, attachments });
    else await api.answerTicketInformation("id", { ...data, attachments });
    const [url, options] = fetch.mock.calls.at(-1);
    expect(url).toBe(anonymous ? "/api/tracking/actions/information-response" : "/api/tickets/id/information-response");
    if (attachments.length) {
      expect(await readBlob(options.body.get("data"))).toEqual(envelope);
      expect(options.body.getAll("attachments")).toEqual(attachments);
      expect(options.headers["Content-Type"]).toBeUndefined();
      expect(options.headers.Authorization).toBe(anonymous ? undefined : "Bearer citizen-token");
    } else expect(JSON.parse(options.body)).toEqual(envelope);
  }
});

it.each([400, 403, 409, 410, 422])("conserva código HTTP %s", async (status) => {
  fetch.mockResolvedValue({ ok: false, status, json: async () => ({ code: "EVIDENCE_REQUIRED", message: "Falta evidencia" }) });
  await expect(api.confirmReclassificationProposal("id", 1)).rejects.toMatchObject({ status, code: "EVIDENCE_REQUIRED", message: "Falta evidencia" });
});
