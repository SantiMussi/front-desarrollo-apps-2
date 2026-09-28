import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./apiClient";

const ok = (body = { ok: true }, status = 200) => ({
  ok: true,
  status,
  json: vi.fn().mockResolvedValue(body),
  blob: vi.fn().mockResolvedValue(new Blob(["file"])),
  headers: new Headers({ "content-disposition": 'attachment; filename="evidence.txt"' }),
});

const payload = {
  active: true,
  attachments: [],
  code: "CODE",
  comment: "comment",
  description: "description",
  details: { source: "test" },
  internalMessage: "internal",
  labelIds: [1, 2],
  mainTicketId: 2,
  messageForCitizen: "message",
  moduleId: 4,
  name: "name",
  publicMessage: "public",
  reason: "reason",
  reasonCode: "OTHER",
  requestTypeId: 3,
  responseMessage: "response",
  score: 5,
  stars: 5,
  text: "text",
  ticketPassword: "secret",
  type: "TOTAL",
  updateType: "PROGRESS",
  visibility: "PUBLIC",
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok()));
});

describe("apiClient token and response handling", () => {
  it("stores, reads and removes the bearer token", async () => {
    api.storeToken("jwt");
    expect(api.getStoredToken()).toBe("jwt");
    await api.fetchCurrentUser();
    expect(fetch).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
    }));
    api.removeStoredToken();
    expect(api.getStoredToken()).toBeNull();
  });

  it.each([
    [{ message: "message" }, "message", "A"],
    [{ error: "error" }, "error", null],
    [{ detail: "detail" }, "detail", null],
    [{}, "Error 422: Invalid", null],
  ])("turns unsuccessful responses into rich errors", async (body, message, code) => {
    fetch.mockResolvedValueOnce({ ok: false, status: 422, statusText: "Invalid", json: vi.fn().mockResolvedValue({ ...body, code }) });
    await expect(api.fetchCategories()).rejects.toMatchObject({ message, status: 422, code });
  });

  it("handles invalid error bodies and empty successful responses", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Broken", json: vi.fn().mockRejectedValue(new Error("invalid json")) });
    await expect(api.fetchCategories()).rejects.toThrow("Error 500: Broken");
    fetch.mockResolvedValueOnce(ok(undefined, 204));
    await expect(api.deleteStaffLabel(1)).resolves.toBeNull();
  });
});

describe("apiClient endpoint contracts", () => {
  const noArguments = ["fetchCurrentUser", "fetchCategories", "fetchAdminCategories", "fetchNeighborhoods", "fetchStaffLabels"];
  const objectArgument = ["login", "register", "createCategory", "createSubcategory", "createRequestType"];
  const idArgument = [
    "fetchSubcategories", "fetchRequestTypes", "fetchRequestTypeForm", "activateCategory", "deactivateCategory",
    "fetchAdminSubcategories", "activateSubcategory", "deactivateSubcategory", "fetchAdminRequestTypes",
    "activateRequestType", "deactivateRequestType", "fetchAdminRequestTypeForm", "fetchMyTicketDetail",
    "confirmTicketResolution", "fetchStaffTicketDetail", "fetchTicketCitizenView", "fetchStaffLabel", "deleteStaffLabel",
    "reviewTicket", "routeTicket", "fetchDuplicateCandidates", "fetchTicketMessages", "downloadTicketAttachment",
  ];
  const idAndPayload = [
    "updateCategory", "updateSubcategory", "updateRequestType", "saveAdminRequestTypeForm", "reopenTicket",
    "answerTicketInformation", "submitSatisfactionSurvey", "updateStaffLabel", "assignTicketLabels",
    "updateTicketClassification", "requestTicketInformation", "resolveTicket", "cancelTicket", "linkTicketDuplicate",
    "createTicketMessage", "uploadTicketAttachment",
  ];

  it.each(noArguments)("%s calls its endpoint", async (name) => {
    await api[name]();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it.each(objectArgument)("%s serializes its payload", async (name) => {
    await api[name](payload);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/"), expect.objectContaining({ body: JSON.stringify(payload) }));
  });

	it("createStaffLabel serializes only the fields supported by its contract", async () => {
    await api.createStaffLabel(payload);

    expect(fetch).toHaveBeenCalledWith("/api/staff/labels", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        description: payload.description,
      }),
    }));
  });


  it.each(idArgument)("%s safely sends an identifier", async (name) => {
    await api[name]("id / unsafe");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it.each(idAndPayload)("%s sends its identifier and payload", async (name) => {
    const second = name === "uploadTicketAttachment" ? new File(["x"], "x.txt") : payload;
    await api[name]("ticket / 1", second);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("filters empty query parameters for citizen and staff lists", async () => {
    await api.fetchMyTickets({ page: 2, status: "", category: null });
    expect(fetch.mock.calls[0][0]).toBe("/api/me/tickets?page=2");
    await api.fetchAgentTickets({ page: 1, size: 20, status: undefined });
    expect(fetch.mock.calls[1][0]).toContain("page=1");
    await api.fetchTicketsByLabel(7, { sort: "createdAt,desc" });
    expect(fetch.mock.calls[2][0]).toContain("sort=createdAt%2Cdesc");
  });

  it("covers ticket creation with JSON and multipart bodies", async () => {
    await api.createTicket(payload);
    expect(fetch).toHaveBeenCalledOnce();
    await api.createTicket(payload, [new File(["proof"], "proof.txt")], { skipAuth: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].body).toBeInstanceOf(FormData);
  });

  it("covers anonymous ticket operations", async () => {
    await api.trackTicket("ABC 123", "secret");
    await api.confirmAnonymousResolution("ABC", "secret");
    await api.reopenAnonymousTicket("ABC", payload);
    await api.cancelAnonymousTicket("ABC", payload);
    await api.sendAnonymousMessage("ABC", payload);
    await api.answerAnonymousInformation("ABC", payload);
    await api.rateAnonymousTicketAttention("ABC", payload);
    await api.uploadAnonymousAttachment("ABC", "secret", new File(["x"], "x.txt"));
    await api.downloadAnonymousAttachment("ABC", "secret", 9);
    expect(fetch).toHaveBeenCalledTimes(9);
  });

  it("covers staff workflow and message mutations", async () => {
    await api.removeTicketLabel(1, 2);
    await api.simulateStatusUpdate(1, payload);
    await api.simulateAreaResolution(1, payload);
    await api.returnTicketToAgent(1, 3, payload);
    await api.rejectTicket(1, 3, payload);
    await api.startTicketWork(1, 3);
    await api.updateTicketMessage(1, 2, payload);
    await api.deleteTicketMessage(1, 2);
    expect(fetch).toHaveBeenCalledTimes(8);
  });
});