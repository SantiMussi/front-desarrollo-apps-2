import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useAgentTickets } from "../useAgentTickets";
import { fetchAreaTickets, fetchAgentTickets } from "../../services/apiClient";
vi.mock("../../services/apiClient", () => ({ fetchAgentTickets: vi.fn(), fetchAreaTickets: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

it("uses the area endpoint with server pagination and location filter", async () => {
  fetchAreaTickets.mockResolvedValue({ content: [{ id: "area" }], totalElements: 23, totalPages: 2, number: 1 });
  const { result } = renderHook(() => useAgentTickets({ areaScoped: true, withoutLocation: true, page: 1 }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current).toMatchObject({ tickets: [{ id: "area" }], totalElements: 23, pageNumber: 1 });
  expect(fetchAreaTickets).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ page: 1, withoutLocation: true }));
  expect(fetchAgentTickets).not.toHaveBeenCalled();
});
it.each([401,403,404,409])("clears data for HTTP %s", async (status) => {
  fetchAreaTickets.mockResolvedValueOnce({ content: [{ id: "old" }] }).mockRejectedValueOnce({ status, message: "HTTP failed" });
  const { result } = renderHook(() => useAgentTickets({ areaScoped: true }));
  await waitFor(() => expect(result.current.tickets).toHaveLength(1));
  act(() => result.current.refetch());
  expect(result.current.tickets).toEqual([]);
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(result.current.tickets).toEqual([]);
});
it("hides the old scope immediately and ignores late HTTP responses", async () => {
  const old=deferred(), area=deferred();
  fetchAgentTickets.mockReturnValue(old.promise);fetchAreaTickets.mockReturnValue(area.promise);
  const { result, rerender } = renderHook(({ areaScoped }) => useAgentTickets({ areaScoped }), { initialProps: { areaScoped: false } });
  rerender({ areaScoped: true });expect(result.current.tickets).toEqual([]);
  await act(async () => area.resolve({ content: [{ id: "permitted" }] }));
  await act(async () => old.resolve({ content: [{ id: "foreign" }] }));
  expect(result.current.tickets).toEqual([{ id: "permitted" }]);
});
