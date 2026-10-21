import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/apiClient";
import { useStaffTicketDetail } from "../useStaffTicketDetail";
import { useTicketCitizenView } from "../useTicketCitizenView";
import { useTicketMessages } from "../useTicketMessages";
import { useMyTicketDetail } from "../useMyTicketDetail";
import { useReclassificationProposals } from "../useReclassificationProposals";

vi.mock("../../services/apiClient", () => ({
  fetchStaffTicketDetail: vi.fn(), fetchTicketCitizenView: vi.fn(), fetchTicketMessages: vi.fn(),
  createTicketMessage: vi.fn(), updateTicketMessage: vi.fn(), deleteTicketMessage: vi.fn(),
  fetchMyTickets: vi.fn(), fetchMyTicketDetail: vi.fn(), fetchCancellationRequests: vi.fn(),
  confirmTicketResolution: vi.fn(), reopenTicket: vi.fn(), answerTicketInformation: vi.fn(), submitSatisfactionSurvey: vi.fn(),
  fetchReclassificationProposals: vi.fn(),
}));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
beforeEach(() => { vi.resetAllMocks(); api.fetchCancellationRequests.mockResolvedValue([]); });

describe("H28 detail navigation and reload races", () => {
  for (const [hook, method, key] of [[useStaffTicketDetail, "fetchStaffTicketDetail", "ticket"], [useTicketCitizenView, "fetchTicketCitizenView", "view"]]) {
    it(`${method}: hides the previous ticket while the next loads, and rejects late success/error`, async () => {
      const old = deferred(), current = deferred();
      api[method].mockResolvedValueOnce({ id: "A" }).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
      const { result, rerender } = renderHook(({ id }) => hook(id), { initialProps: { id: "A" } });
      await waitFor(() => expect(result.current[key]?.id).toBe("A"));
      let reload; act(() => { reload = result.current.reload(); });
      rerender({ id: "B" });
      expect(result.current[key]).toBeNull();
      expect(result.current.loading).toBe(true);
      await act(async () => { current.resolve({ id: "B" }); });
      await act(async () => { old.reject(new Error("Old error")); await reload; });
      expect(result.current[key]).toEqual({ id: "B" });
      expect(result.current.error).toBeNull();
    });
    it(`${method}: latest reload wins and unmount discards outstanding work`, async () => {
      const old = deferred(), latest = deferred();
      api[method].mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
      const { result, unmount } = renderHook(() => hook("A"));
      let reload; act(() => { reload = result.current.reload(); });
      await act(async () => { latest.resolve({ id: "LATEST" }); await reload; });
      await act(async () => { old.resolve({ id: "OLD" }); });
      expect(result.current[key].id).toBe("LATEST");
      const pending = deferred(); api[method].mockReturnValueOnce(pending.promise);
      act(() => { reload = result.current.reload(); }); unmount();
      pending.resolve({ id: "UNMOUNTED" }); await reload;
      expect(result.current[key].id).toBe("LATEST");
    });
  }
  it("a reclassification reload cannot overwrite proposals for the new ticket", async () => {
    const pending = deferred();
    api.fetchReclassificationProposals.mockResolvedValueOnce([]).mockReturnValueOnce(pending.promise).mockResolvedValueOnce([{ id: "B" }]);
    const a = { id: "A" }, b = { id: "B" };
    const { result, rerender } = renderHook(({ ticket }) => useReclassificationProposals(ticket, true), { initialProps: { ticket: a } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let reload; act(() => { reload = result.current.reload(); }); rerender({ ticket: b });
    await waitFor(() => expect(result.current.proposals).toEqual([{ id: "B" }]));
    await act(async () => { pending.resolve([{ id: "A" }]); await reload; });
    expect(result.current.proposals).toEqual([{ id: "B" }]);
  });
});

describe("H28 messages stay in their ticket context", () => {
  it.each(["send", "edit", "remove"])("late %s cannot change the next ticket messages", async (action) => {
    api.fetchTicketMessages.mockResolvedValueOnce([{ id: 1, text: "A" }]).mockResolvedValueOnce([{ id: 1, text: "B" }]);
    const pending = deferred();
    const method = { send: "createTicketMessage", edit: "updateTicketMessage", remove: "deleteTicketMessage" }[action];
    api[method].mockReturnValue(pending.promise);
    const { result, rerender } = renderHook(({ id }) => useTicketMessages(id), { initialProps: { id: "A" } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let task; act(() => { task = action === "send" ? result.current.send("PUBLIC", "old") : result.current[action](1, "old"); });
    rerender({ id: "B" }); expect(result.current.messages).toEqual([]);
    await waitFor(() => expect(result.current.messages).toEqual([{ id: 1, text: "B" }]));
    await act(async () => { pending.resolve({ id: 1, text: "OLD" }); await task; });
    expect(result.current.messages).toEqual([{ id: 1, text: "B" }]);
  });
  it("a late list cannot overwrite a newer ticket and a reload error clears stale messages", async () => {
    const pending = deferred(); api.fetchTicketMessages.mockReturnValueOnce(pending.promise).mockResolvedValueOnce([{ id: "B" }]);
    const { result, rerender } = renderHook(({ id }) => useTicketMessages(id), { initialProps: { id: "A" } });
    rerender({ id: "B" }); await waitFor(() => expect(result.current.messages).toEqual([{ id: "B" }]));
    await act(async () => pending.resolve([{ id: "A" }])); expect(result.current.messages).toEqual([{ id: "B" }]);
    api.fetchTicketMessages.mockRejectedValueOnce(Object.assign(new Error("Denied"), { status: 403 }));
    await act(async () => result.current.reload());
    expect(result.current.messages).toEqual([]); expect(result.current.error).toMatch(/permiso/);
  });
});

describe("H28 identified ticket mutation races", () => {
  const a = { id: "a", publicId: "A", currentStatus: "CLOSED" }, b = { id: "b", publicId: "B", currentStatus: "REGISTERED" };
  it.each(["confirmResolution", "answerInformation", "rateAttention"])("late %s cannot mutate another ticket", async (action) => {
    api.fetchMyTickets.mockResolvedValue({ content: [a, b] });
    api.fetchMyTicketDetail.mockImplementation(async (id) => id === "a" ? a : b);
    const pending = deferred();
    api[{ confirmResolution: "confirmTicketResolution", answerInformation: "answerTicketInformation", rateAttention: "submitSatisfactionSurvey" }[action]].mockReturnValue(pending.promise);
    const { result, rerender } = renderHook(({ id }) => useMyTicketDetail(id), { initialProps: { id: "A" } });
    await waitFor(() => expect(result.current.ticket?.id).toBe("a"));
    let task; act(() => { task = result.current.actions[action](action === "rateAttention" ? 5 : "old"); });
    rerender({ id: "B" }); expect(result.current.ticket).toBeNull();
    await waitFor(() => expect(result.current.ticket?.id).toBe("b"));
    expect(result.current.actionLoading).toBe(false);
    await act(async () => { pending.resolve({ currentStatus: "IN_REVIEW" }); expect(await task).toBe(false); });
    expect(result.current.ticket).toMatchObject({ id: "b", currentStatus: "REGISTERED", rating: null });
  });
  it("an older load cannot restore a different citizen ticket", async () => {
    const pending = deferred(); api.fetchMyTickets.mockResolvedValue({ content: [a, b] });
    api.fetchMyTicketDetail.mockImplementation((id) => id === "a" ? pending.promise : Promise.resolve(b));
    const { result, rerender } = renderHook(({ id }) => useMyTicketDetail(id), { initialProps: { id: "A" } });
    await waitFor(() => expect(api.fetchMyTicketDetail).toHaveBeenCalledWith("a")); rerender({ id: "B" });
    await waitFor(() => expect(result.current.ticket?.id).toBe("b"));
    await act(async () => pending.resolve(a)); expect(result.current.ticket.id).toBe("b");
  });
});
