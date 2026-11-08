import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import * as api from "../../services/apiClient";
import { useMyTicketDetail } from "../useMyTicketDetail";

vi.mock("../../services/apiClient", () => ({ getStoredToken: () => "test-session", fetchMyTickets: vi.fn(), fetchMyTicketDetail: vi.fn(), fetchCancellationRequests: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); api.fetchCancellationRequests.mockResolvedValue([]); });

it("finds a ticket after 200 entries and stops at the matching page", async () => {
  api.fetchMyTickets.mockResolvedValueOnce({ content: Array.from({ length: 200 }, (_, id) => ({ id, publicId: `OTHER-${id}` })), totalPages: 3 })
    .mockResolvedValueOnce({ content: [{ id: "uuid-201", publicId: "OLD" }], totalPages: 3 });
  api.fetchMyTicketDetail.mockResolvedValue({ id: "uuid-201", publicId: "OLD" });
  const { result } = renderHook(() => useMyTicketDetail("OLD"));
  await waitFor(() => expect(result.current.ticket?.id).toBe("uuid-201"));
  expect(api.fetchMyTickets.mock.calls).toEqual([[{ size: 200 }, { signal: expect.any(AbortSignal) }], [{ size: 200, page: 1 }, { signal: expect.any(AbortSignal) }]]);
  expect(api.fetchMyTicketDetail).toHaveBeenCalledWith("uuid-201", { signal: expect.any(AbortSignal) });
});

it("stops at the last or empty page when the ticket is absent", async () => {
  api.fetchMyTickets.mockResolvedValueOnce({ content: [{ publicId: "OTHER" }], last: false })
    .mockResolvedValueOnce({ content: [], last: false });
  const { result } = renderHook(() => useMyTicketDetail("MISSING"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toMatch(/No encontramos/);
  expect(api.fetchMyTickets).toHaveBeenCalledTimes(2);
  expect(api.fetchMyTicketDetail).not.toHaveBeenCalled();
});

it("does not continue an obsolete pagination request after navigation", async () => {
  let resolve;
  api.fetchMyTickets.mockReturnValueOnce(new Promise((done) => { resolve = done; }))
    .mockResolvedValueOnce({ content: [{ publicId: "NEW", id: "new-uuid" }], last: true });
  api.fetchMyTicketDetail.mockResolvedValue({ publicId: "NEW", id: "new-uuid" });
  const { result, rerender } = renderHook(({ id }) => useMyTicketDetail(id), { initialProps: { id: "OLD" } });
  rerender({ id: "NEW" });
  await waitFor(() => expect(result.current.ticket?.id).toBe("new-uuid"));
  await act(async () => resolve({ content: [{ publicId: "OTHER" }], last: false }));
  expect(api.fetchMyTickets).toHaveBeenCalledTimes(2);
  expect(result.current.ticket.id).toBe("new-uuid");
});
