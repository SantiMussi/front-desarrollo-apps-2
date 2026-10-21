import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/apiClient";
import { useAnonymousTicketAccess } from "../useAnonymousTicketAccess";
import { useCreateTicket } from "../useCreateTicket";

vi.mock("../../services/apiClient", () => ({
  trackTicket: vi.fn(), createTicket: vi.fn(), confirmAnonymousResolution: vi.fn(), reopenAnonymousTicket: vi.fn(),
  answerAnonymousInformation: vi.fn(), sendAnonymousMessage: vi.fn(), uploadAnonymousAttachment: vi.fn(), downloadAnonymousAttachment: vi.fn(),
  fetchAnonymousCancellationRequests: vi.fn(), cancelAnonymousTicket: vi.fn(),
}));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const privateTicket = { publicId: "PRIVATE", currentStatus: "RESOLVED", messages: [{ id: 1, text: "Private message" }], attachments: [{ id: 9 }], history: [] };
beforeEach(() => { vi.resetAllMocks(); api.fetchAnonymousCancellationRequests.mockResolvedValue([]); api.trackTicket.mockResolvedValue(privateTicket); });
async function accredited() {
  const hook = renderHook(({ code }) => useAnonymousTicketAccess(code), { initialProps: { code: "ABC" } });
  await act(async () => { await hook.result.current.accredit("private-password"); });
  return hook;
}
describe("H28 privacy and out-of-order anonymous responses", () => {
  it("late accreditation cannot restore private data after reset", async () => {
    const pending = deferred(); api.trackTicket.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useAnonymousTicketAccess("ABC"));
    let task; act(() => { task = result.current.accredit("pw"); });
    act(() => result.current.reset());
    await act(async () => { pending.resolve(privateTicket); expect(await task).toBe(false); });
    expect(result.current).toMatchObject({ ticket: null, accredited: false });
  });
  it("new accreditation wins over an earlier response", async () => {
    const old = deferred(); const latest = deferred();
    api.trackTicket.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    const { result } = renderHook(() => useAnonymousTicketAccess("ABC"));
    let first, second;
    act(() => { first = result.current.accredit("old"); second = result.current.accredit("new"); });
    await act(async () => { latest.resolve({ ...privateTicket, publicId: "NEW" }); await second; });
    await act(async () => { old.resolve(privateTicket); await first; });
    expect(result.current.ticket.publicId).toBe("NEW");
  });
  it("changing ticket context clears accreditation and ignores a late message", async () => {
    const { result, rerender } = await accredited();
    const pending = deferred(); api.sendAnonymousMessage.mockReturnValue(pending.promise);
    let task; act(() => { task = result.current.sendMessage("draft").catch((err) => err); });
    rerender({ code: "OTHER" });
    await waitFor(() => expect(result.current.ticket).toBeNull());
    await act(async () => { pending.resolve({ id: 2, text: "old message" }); await task; });
    expect(result.current).toMatchObject({ ticket: null, accredited: false });
    expect(result.current.attachments.canUpload).toBe(false);
  });
  it("a 401 revokes accreditation and discards an information response already in flight", async () => {
    const { result } = await accredited();
    const pending = deferred(); api.answerAnonymousInformation.mockReturnValue(pending.promise);
    api.confirmAnonymousResolution.mockRejectedValue(Object.assign(new Error("Revoked"), { status: 401 }));
    let task; act(() => { task = result.current.actions.answerInformation("sensitive"); });
    await act(async () => { await result.current.actions.confirmResolution(); });
    expect(result.current).toMatchObject({ ticket: null, accredited: false });
    await act(async () => { pending.resolve({ currentStatus: "IN_REVIEW" }); expect(await task).toBe(false); });
    expect(result.current.ticket).toBeNull();
    await expect(result.current.actions.confirmResolution()).resolves.toBe(false);
  });
  it.each(["uploadFile", "downloadFile"])("protected %s revokes credentials on 401", async (action) => {
    const { result } = await accredited();
    const method = action === "uploadFile" ? api.uploadAnonymousAttachment : api.downloadAnonymousAttachment;
    method.mockRejectedValue(Object.assign(new Error("Revoked"), { status: 401 }));
    await act(async () => { await expect(result.current.attachments[action]({ id: 9 })).rejects.toThrow("Revoked"); });
    expect(result.current.ticket).toBeNull();
    await expect(result.current.attachments[action]({ id: 9 })).rejects.toThrow(/acreditar/);
  });
  it.each(["message", "refresh", "history"])("a 401 from %s clears private data", async (source) => {
    const { result } = await accredited();
    const error = Object.assign(new Error("Revoked"), { status: 401 });
    if (source === "message") {
      api.sendAnonymousMessage.mockRejectedValueOnce(error);
      await act(async () => { await expect(result.current.sendMessage("draft")).rejects.toThrow("Revoked"); });
    } else {
      if (source === "refresh") api.trackTicket.mockRejectedValueOnce(error);
      else api.fetchAnonymousCancellationRequests.mockRejectedValueOnce(error);
      await act(async () => result.current.cancellation.reload());
    }
    expect(result.current).toMatchObject({ ticket: null, accredited: false });
    expect(result.current.attachments.canUpload).toBe(false);
  });
  it("failed terminal mutation preserves server state and repeated clicks send only once", async () => {
    const { result } = await accredited();
    const pending = deferred(); api.confirmAnonymousResolution.mockReturnValue(pending.promise);
    let task; act(() => { task = result.current.actions.confirmResolution(); });
    await expect(result.current.actions.confirmResolution()).resolves.toBe(false);
    expect(api.confirmAnonymousResolution).toHaveBeenCalledTimes(1);
    expect(result.current.ticket.currentStatus).toBe("RESOLVED");
    await act(async () => { pending.reject(Object.assign(new Error("Changed"), { status: 409 })); expect(await task).toBe(false); });
    expect(result.current.ticket.currentStatus).toBe("RESOLVED");
  });
  it("unmount invalidates outstanding accreditation", async () => {
    const pending = deferred(); api.trackTicket.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useAnonymousTicketAccess("ABC"));
    let task; act(() => { task = result.current.accredit("pw"); }); unmount();
    pending.resolve(privateTicket); expect(await task).toBe(false);
  });
});
describe("H28 creation mutation lifecycle", () => {
  it("prevents two submissions in the same render and waits for a confirmed tracking code", async () => {
    const pending = deferred(); api.createTicket.mockReturnValue(pending.promise);
    const { result } = renderHook(useCreateTicket);
    let task; act(() => { task = result.current.submit({}); });
    await expect(result.current.submit({})).resolves.toBeNull();
    expect(api.createTicket).toHaveBeenCalledTimes(1);
    expect(result.current.trackingCode).toBeNull();
    await act(async () => { pending.resolve({ trackingCode: "CONFIRMED" }); await task; });
    expect(result.current.trackingCode).toBe("CONFIRMED");
  });
  it.each([undefined, {}, { trackingCode: "" }])("does not announce malformed success %j", async (response) => {
    api.createTicket.mockResolvedValue(response);
    const { result } = renderHook(useCreateTicket);
    await act(async () => { expect(await result.current.submit({})).toBeNull(); });
    expect(result.current.error).toMatch(/no confirmó/);
    expect(result.current.trackingCode).toBeNull();
  });
  it("reset discards a late success while a newer request is pending", async () => {
    const old = deferred(), latest = deferred(); api.createTicket.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    const { result } = renderHook(useCreateTicket);
    let first, second; act(() => { first = result.current.submit({}); });
    act(() => result.current.reset()); act(() => { second = result.current.submit({}); });
    await act(async () => { old.resolve({ trackingCode: "OLD" }); await first; });
    expect(result.current.loading).toBe(true); expect(result.current.trackingCode).toBeNull();
    await act(async () => { latest.resolve({ trackingCode: "NEW" }); await second; });
    expect(result.current.trackingCode).toBe("NEW");
  });
});
