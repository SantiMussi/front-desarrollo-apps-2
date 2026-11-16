// Real HTTP integration. Run only against a new disposable DEV database; see docs/quality.md.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import process from "node:process";

const base = process.env.M2_REAL_API_URL;
assert.equal(process.env.M2_REAL_TESTS_DISPOSABLE, "YES", "Explicit disposable environment acknowledgement required");
assert.ok(base && /^http:\/\/(127\.0\.0\.1|localhost):\d+\/api$/.test(base), "Use a dedicated loopback API port");
const records = [], checks = [];
process.on("uncaughtException", async (error) => {
  const failure = { outcome: "FAIL", message: error.message, status: error.status, code: error.code, checks, records };
  await writeFile(process.env.M2_REAL_REPORT ?? "integration-real-result.json", JSON.stringify(failure, null, 2));
  console.error(JSON.stringify({ outcome: "FAIL", message: error.message, status: error.status, code: error.code }));
  process.exitCode = 1;
});
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(new URL(url).origin, new URL(base).origin);
  const result = await nativeFetch(url, { ...options, signal: AbortSignal.timeout(10000) });
  records.push({ method: options?.method ?? "GET", path: new URL(url).pathname, status: result.status });
  // Tracking credentials must never leave a JSON body or multipart data part.
  assert.ok(!url.includes("anonymous-real-password"));
  assert.ok(!/tracking\/(?!access|actions)/.test(new URL(url).pathname));
  return result;
};
const memory = new Map();
globalThis.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
// Load the actual Vite client without a browser bundler. No endpoint is mocked.
const source = (await readFile(new URL("../src/services/apiClient.js", import.meta.url), "utf8"))
  .replace("import.meta.env.VITE_API_BASE_URL", JSON.stringify(base));
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const tokens = {};
for (const [role, username, env] of [
  ["admin", "module.admin@example.test", "MOCK_ADMIN_PASSWORD"], ["agent", "agent@example.test", "MOCK_AGENT_PASSWORD"],
  ["citizen", "citizen@example.test", "MOCK_CITIZEN_PASSWORD"], ["area", "area.responsible@example.test", "MOCK_AREA_RESPONSIBLE_PASSWORD"],
]) {
  assert.ok(process.env[env], `Missing ${env}`);
  const login = await api.login({ username, password: process.env[env] });
  assert.ok(login.token); tokens[role] = login.token;
}
const as = (role) => role ? api.storeToken(tokens[role]) : api.removeStoredToken();
as("admin");
const marker = Date.now();
const category = await api.createCategory({ name: `H18 H28 ${marker}`, description: "Disposable synthetic integration" });
const sub = await api.createSubcategory({ categoryId: category.id, name: "Validaciones" });
const newType = (suffix, extra = {}) => api.createRequestType({ subcategoryId: sub.id, code: `Q_${marker}_${suffix}`, name: `H18 ${suffix}`, description: "Synthetic fixture", ticketType: "COMPLAINT", responsibleAreaId: "M2", minimumPriority: "LOW", baseRisk: "LOW", affectedPopulationFactor: 0, allowsAnonymous: true, requiresLocation: false, ...extra });
const optional = await newType("optional"), located = await newType("located", { requiresLocation: true });
const dynamic = await newType("dynamic"), risky = await newType("risky", { baseRisk: "HIGH" });
const fields = [
  { code: "flag", label: "Bandera", type: "BOOLEAN", required: true, displayOrder: 1 },
  { code: "count", label: "Cantidad", type: "NUMBER", required: true, displayOrder: 2, config: { min: 0, max: 10 } },
  { code: "unknown", label: "Desconocido", type: "TEXT", required: true, allowUnknown: true, displayOrder: 3 },
  { code: "choice", label: "Opción", type: "SELECT", required: true, displayOrder: 4, config: { options: [{ value: "A", label: "A" }] } },
  { code: "date", label: "Fecha", type: "DATE", required: true, displayOrder: 5 },
];
await api.saveAdminRequestTypeForm(dynamic.id, { fields });
const answers = { flag: false, count: 0, unknown: null, choice: "A", date: "2024-02-29" };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAI0lEQVR4nGPUyljFQApgIkk1w6gG4gATkergYFQDMYDkUAIA+QUBXE6bfBgAAAAASUVORK5CYII=", "base64");
const file = () => new File([png], "proof.png", { type: "image/png" });
const payload = (type, extra = {}) => ({ requestTypeId: type.id, summary: "Integración H18 H28", description: "Prueba sintética sobre base temporal exclusiva.", formData: {}, location: null, ...extra });
const create = async (type = optional, extra = {}, anonymous = false, evidence = []) => {
  as(anonymous ? null : "citizen");
  return api.createTicket(payload(type, { ...extra, ...(anonymous ? { anonymousAccessPassword: "anonymous-real-password" } : {}) }), evidence.map((item) => ({ file: item })), { skipAuth: anonymous });
};

const first = await create(); assert.ok(first.trackingCode);
await create(located, { location: { addressLine: "Plaza central" } });
await create(located, { location: { latitude: 0, longitude: 0 } });
const neighborhoods = await api.fetchNeighborhoods(); assert.ok(neighborhoods.length);
await create(located, { location: { neighborhoodId: neighborhoods[0].id } });
await assert.rejects(create(located), { status: 400 });
await assert.rejects(create(located, { location: { latitude: 0 } }), { status: 400 });
await assert.rejects(create(located, { location: { latitude: 91, longitude: 0 } }), { status: 400 });
const structured = await create(dynamic, { formData: answers });
assert.equal((await api.fetchMyTicketDetail(structured.ticketId)).currentStatus, "REGISTERED");
await assert.rejects(create(dynamic, { formData: { ...answers, choice: "invalid" } }), { status: 400 });
await assert.rejects(create(dynamic, { formData: { ...answers, date: "2025-02-29" } }), { status: 400 });
await assert.rejects(create(risky), { status: 422 });
const evidenceTicket = await create(risky, {}, false, [file()]);
const detail = await api.fetchMyTicketDetail(evidenceTicket.ticketId);
assert.ok(detail.attachments.length); const attachmentId = detail.attachments[0].id;
assert.equal((await api.downloadTicketAttachment(attachmentId)).size, png.length);
checks.push("H18 optional/manual/neighborhood/zero coordinates; incomplete/range/required errors; JSON false/0/null/SELECT/DATE; evidence 422 and multipart");

const anonymous = await create(optional, {}, true, [file()]);
const publicView = await api.trackTicket(anonymous.trackingCode);
assert.ok(!JSON.stringify(publicView).includes("anonymous-real-password"));
await assert.rejects(api.downloadTicketAttachment(attachmentId), { status: 401 });
await assert.rejects(api.trackTicket(anonymous.trackingCode, "wrong-password"), { status: 401 });
const privateView = await api.trackTicket(anonymous.trackingCode, "anonymous-real-password");
assert.ok(privateView.attachments.length);
await api.downloadAnonymousAttachment(anonymous.trackingCode, "anonymous-real-password", privateView.attachments[0].id);
checks.push("tracking public/accredited; wrong credentials 401; protected downloads; credentials remain in body");

as("agent"); await api.reviewTicket(first.ticketId);
await api.createTicketMessage(first.ticketId, { visibility: "INTERNAL", text: "SYNTHETIC_INTERNAL_PRIVATE" });
await api.requestTicketInformation(first.ticketId, { messageForCitizen: "Describí el lugar", internalMessage: "SYNTHETIC_INTERNAL_PRIVATE" });
as("citizen"); assert.ok(!JSON.stringify(await api.fetchMyTicketDetail(first.ticketId)).includes("SYNTHETIC_INTERNAL_PRIVATE"));
await api.answerTicketInformation(first.ticketId, { responseMessage: "Respuesta general", attachments: [file()] });
as("agent"); assert.equal((await api.fetchStaffTicketDetail(first.ticketId)).currentStatus, "IN_REVIEW");
const proposal = await api.proposeTicketReclassification(first.ticketId, { requestTypeId: dynamic.id });
assert.equal(proposal.status, "WAITING_INFORMATION");
as("area"); await assert.rejects(api.fetchReclassificationProposals(first.ticketId), { status: 403 });
as("citizen"); await api.answerTicketInformation(first.ticketId, { formData: answers });
as("agent"); assert.equal((await api.fetchReclassificationProposal(first.ticketId, proposal.id)).status, "READY");
await api.confirmReclassificationProposal(first.ticketId, proposal.id);
assert.equal((await api.fetchStaffTicketDetail(first.ticketId)).currentStatus, "IN_PROGRESS");
await api.resolveTicket(first.ticketId, { type: "ACTION_COMPLETED", publicMessage: "Solución sintética" });
as("admin"); await assert.rejects(api.submitSatisfactionSurvey(first.ticketId, { score: 4 }), { status: 403 });
as("citizen"); await assert.rejects(api.submitSatisfactionSurvey(first.ticketId, { score: 4 }), { status: 409 });
await api.confirmTicketResolution(first.ticketId);
await api.submitSatisfactionSurvey(first.ticketId, { score: 4, comment: "Prueba sintética" });
await assert.rejects(api.submitSatisfactionSurvey(first.ticketId, { score: 5 }), { status: 409 });
checks.push("GENERAL information+attachment; INTERNAL privacy; H03/H04 WAITING_INFORMATION/READY/confirm; AREA_RESPONSIBLE 403; identified survey ownership/CLOSED/uniqueness");
const cancelled = await create();
await api.cancelTicket(cancelled.ticketId, { reasonCode: "WITHDRAWN_BY_CITIZEN" });
assert.equal((await api.fetchMyTicketDetail(cancelled.ticketId)).currentStatus, "CANCELLED");
checks.push("H05 direct cancellation uses effective backend state");
await writeFile(process.env.M2_REAL_REPORT ?? "integration-real-result.json", JSON.stringify({ outcome: "PASS", checks, requests: records.length, records }, null, 2));
console.log(JSON.stringify({ outcome: "PASS", checks, requests: records.length }, null, 2));
