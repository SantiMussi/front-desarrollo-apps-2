import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AiTicketInsightsCard from "../AiTicketInsightsCard";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { fetchTicketAiInsights } from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({ fetchTicketAiInsights: vi.fn() }));

const duplicate = {
  ticketId: "t-2", publicId: "RC-2026-0002", summary: "Luminaria rota en la misma cuadra",
  requestTypeName: "Luminaria apagada", currentStatus: "IN_PROGRESS", distanceMeters: 80,
};

const analyze = () => fireEvent.click(screen.getByRole("button", { name: /Analizar ticket/ }));

beforeEach(() => vi.clearAllMocks());

describe("AiTicketInsightsCard", () => {
  it("no consulta nada al abrir el ticket: el análisis se pide a mano", () => {
    renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    expect(fetchTicketAiInsights).not.toHaveBeenCalled();
    expect(screen.getByText(/Es orientativo/)).toBeInTheDocument();
  });

  it("muestra resumen, urgencia sugerida y duplicados con su explicación", async () => {
    fetchTicketAiInsights.mockResolvedValue({
      source: "AI", summary: "Luminaria apagada hace una semana.", urgencyHint: "HIGH", urgencyReason: "Calle oscura.",
      duplicates: [{ ...duplicate, similarity: "HIGH", reason: "Misma cuadra y mismo problema." }],
    });
    renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    analyze();

    expect(await screen.findByText("Luminaria apagada hace una semana.")).toBeInTheDocument();
    expect(screen.getByText(/Urgencia sugerida: Alta/)).toBeInTheDocument();
    expect(screen.getByText(/la prioridad real la calcula el sistema/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RC-2026-0002" })).toHaveAttribute("href", "/agente/tickets/t-2");
    expect(screen.getByText("Muy parecido")).toBeInTheDocument();
    expect(screen.getByText("Misma cuadra y mismo problema.")).toBeInTheDocument();
    expect(fetchTicketAiInsights).toHaveBeenCalledWith("t-1");
  });

  it("informa cuando la IA no encontró duplicados", async () => {
    fetchTicketAiInsights.mockResolvedValue({ source: "AI", summary: "Resumen.", urgencyHint: null, duplicates: [] });
    renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    analyze();

    expect(await screen.findByText("La IA no encontró duplicados probables.")).toBeInTheDocument();
  });

  it("sin IA lista los tickets cercanos, sin resumen ni similitud", async () => {
    fetchTicketAiInsights.mockResolvedValue({ source: "UNAVAILABLE", summary: null, duplicates: [{ ...duplicate, similarity: null, reason: null }] });
    renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    analyze();

    expect(await screen.findByText(/La ayuda con IA no está disponible/)).toBeInTheDocument();
    expect(screen.getByText("Tickets cercanos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RC-2026-0002" })).toBeInTheDocument();
    expect(screen.queryByText("Muy parecido")).not.toBeInTheDocument();
  });

  it.each([
    [429, /muchas consultas seguidas/],
    [403, /No tenés permiso/],
    [500, /No pudimos consultar la ayuda automática/],
  ])("el error %s se explica sin romper la pantalla", async (status, message) => {
    fetchTicketAiInsights.mockRejectedValue(Object.assign(new Error("x"), { status }));
    renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    analyze();

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("el texto devuelto por el servidor se muestra como texto, nunca como HTML", async () => {
    fetchTicketAiInsights.mockResolvedValue({
      source: "AI", summary: "<script>alert(1)</script> Resumen", urgencyHint: null,
      duplicates: [],
    });
    const { container } = renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    analyze();

    await screen.findByText(/Resumen/);
    expect(container.querySelector("script")).toBeNull();
  });

  it("no muestra el análisis de un ticket al pasar a otro", async () => {
    fetchTicketAiInsights.mockResolvedValue({ source: "AI", summary: "Resumen del ticket uno.", urgencyHint: null, duplicates: [] });
    const { rerender } = renderWithProviders(<AiTicketInsightsCard ticketId="t-1" />);
    analyze();
    await screen.findByText("Resumen del ticket uno.");

    rerender(<AiTicketInsightsCard ticketId="t-9" />);
    expect(screen.queryByText("Resumen del ticket uno.")).not.toBeInTheDocument();
  });
});
