import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TicketTable from "../TicketTable";
import TicketReasonDialog from "../TicketReasonDialog";
import TicketTransitionDialog from "../TicketTransitionForm";
import { renderWithProviders } from "../../../test/renderWithProviders";

const baseTicket = (overrides = {}) => ({
  id: 1,
  publicId: "TK-001",
  summary: "Bache profundo",
  ticketType: "COMPLAINT",
  citizen: { initials: "AB", name: "Ana B." },
  assignee: { name: "Agente Uno", avatar: "http://x/a.png" },
  status: "Registrado",
  createdAt: "10 mar 2026",
  slaIndicator: { status: "on-track", percentage: 40, label: "En plazo" },
  ...overrides,
});

describe("TicketTable", () => {
  it("muestra el estado vacío", () => {
    renderWithProviders(<TicketTable tickets={[]} />);
    expect(screen.getByText("No hay tickets que coincidan")).toBeInTheDocument();
    renderWithProviders(<TicketTable tickets={null} />);
    expect(screen.getAllByText("No hay tickets que coincidan")).toHaveLength(2);
  });

  it("renderiza todas las columnas por defecto", () => {
    renderWithProviders(<TicketTable tickets={[baseTicket()]} />);
    ["CLAVE", "RESUMEN", "INFORMADOR", "RESPONSABLE", "ESTADO", "CREADO", "SLA"].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.getByText("TK-001")).toBeInTheDocument();
    expect(screen.getByText("Bache profundo")).toBeInTheDocument();
    expect(screen.getByText("Ana B.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Agente Uno" })).toBeInTheDocument();
    expect(screen.getByText("Registrado")).toBeInTheDocument();
    expect(screen.getByText("10 mar 2026")).toBeInTheDocument();
    expect(screen.getByText("En plazo")).toBeInTheDocument();
    expect(screen.getByText("Reclamo", { selector: '[role="tooltip"]' })).toBeInTheDocument();
  });

  it("respeta las columnas visibles indicadas", () => {
    renderWithProviders(
      <TicketTable
        tickets={[baseTicket()]}
        columns={[
          { id: "clave", label: "ID", visible: true },
          { id: "summary", label: "Resumen", visible: false },
          { id: "desconocida", label: "Otra", visible: true },
        ]}
      />
    );
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.queryByText("Resumen")).not.toBeInTheDocument();
    expect(screen.getByText("Otra")).toBeInTheDocument();
  });

  it("muestra la clave sin ícono si el tipo es desconocido y usa el id si no hay publicId", () => {
    renderWithProviders(<TicketTable tickets={[baseTicket({ ticketType: "OTRO", publicId: undefined, id: 77 })]} />);
    expect(screen.getAllByText("77").length).toBeGreaterThan(0);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("muestra las insignias de escalado con y sin motivo, y de duplicado", () => {
    renderWithProviders(
      <TicketTable
        tickets={[
          baseTicket({ id: 1, escalated: true, escalationReasonCode: "CRITICAL_PRIORITY", duplicateLinkInfo: { isDuplicate: true, mainTicketId: 5, mainTicketPublicId: "TK-005" } }),
          baseTicket({ id: 2, publicId: "TK-002", escalated: true }),
        ]}
      />
    );
    expect(screen.getAllByText("Escalado")).toHaveLength(2);
    expect(screen.getByTitle("Motivo: CRITICAL_PRIORITY")).toBeInTheDocument();
    expect(screen.getByTitle(/independientemente del estado/)).toBeInTheDocument();
    expect(screen.getByText(/Duplicado de TK-005/)).toBeInTheDocument();
  });

  it("muestra un avatar de respaldo cuando no hay foto", () => {
    renderWithProviders(<TicketTable tickets={[baseTicket({ assignee: { name: "Sin asignar" } })]} />);
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it.each([
    [{ status: "overdue", percentage: null, label: "SLA vencido" }, "bg-red-50/40"],
    [{ status: "at-risk", percentage: 90, label: "Próximo a vencer" }, "bg-amber-50/45"],
    [{ status: "on-track", percentage: 10, label: "En plazo" }, "hover:bg-slate-50"],
  ])("colorea la fila según el SLA %j", (slaIndicator, className) => {
    renderWithProviders(<TicketTable tickets={[baseTicket({ slaIndicator })]} />);
    expect(screen.getByRole("row", { name: /Abrir ticket 1/ }).className).toContain(className);
  });

  it("muestra guion si el SLA no aplica y el título según el porcentaje", () => {
    const { unmount } = renderWithProviders(<TicketTable tickets={[baseTicket({ slaIndicator: { status: "not-applicable", percentage: null, label: "No aplica" } })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    unmount();
    const missing = renderWithProviders(<TicketTable tickets={[baseTicket({ slaIndicator: undefined })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    missing.unmount();
    renderWithProviders(<TicketTable tickets={[baseTicket({ slaIndicator: { status: "on-track", percentage: null, label: "En plazo" } })]} />);
    expect(screen.getByTitle("En plazo")).toBeInTheDocument();
  });

  it("muestra el porcentaje consumido", () => {
    renderWithProviders(<TicketTable tickets={[baseTicket({ slaIndicator: { status: "overdue", percentage: 120, label: "Vencido" } })]} />);
    expect(screen.getByTitle("120% del plazo SLA consumido")).toBeInTheDocument();
    expect(screen.getByText("120%")).toBeInTheDocument();
  });

  it("navega al detalle con clic y con Enter", () => {
    renderWithProviders(<TicketTable tickets={[baseTicket({ id: 9 })]} />);
    const row = screen.getByRole("row", { name: /Abrir ticket 9/ });
    fireEvent.keyDown(row, { key: "a" });
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    fireEvent.keyDown(row, { key: "Enter" });
    expect(screen.getByTestId("location")).toHaveTextContent("/agente/tickets/9");
  });

  it("navega con clic en la fila", () => {
    renderWithProviders(<TicketTable tickets={[baseTicket({ id: 4 })]} />);
    fireEvent.click(screen.getByRole("row", { name: /Abrir ticket 4/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("/agente/tickets/4");
  });
});

describe("TicketReasonDialog", () => {
  const setup = (props = {}) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderWithProviders(<TicketReasonDialog ticketPublicId="TK-3" eyebrow="Derivación" title="Rechazar" onCancel={onCancel} onConfirm={onConfirm} {...props} />);
    return { onCancel, onConfirm };
  };

  it("pide un motivo de texto libre y al menos un mensaje", () => {
    const { onConfirm } = setup({ description: "Explicación", confirmLabel: "Rechazar" });
    expect(screen.getByText("Explicación")).toBeInTheDocument();
    expect(screen.getByText(/Derivación · TK-3/)).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Rechazar" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Ej.: AREA_NOT_RESPONSIBLE"), { target: { value: " OTHER " } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Visible solo para el equipo/), { target: { value: " nota " } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({ reasonCode: "OTHER", publicMessage: "", internalMessage: "nota" });
  });

  it("acepta el mensaje público en lugar del interno y usa textos propios", () => {
    const { onConfirm } = setup({ reasonPlaceholder: "Código", reasonLabel: "Razón", danger: true });
    fireEvent.change(screen.getByPlaceholderText("Código"), { target: { value: "X" } });
    fireEvent.change(screen.getByPlaceholderText(/Explicá brevemente/), { target: { value: "Público" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith({ reasonCode: "X", publicMessage: "Público", internalMessage: "" });
    expect(screen.getByText("Razón")).toBeInTheDocument();
  });

  it("usa un selector cuando hay opciones de motivo", () => {
    const { onConfirm } = setup({ reasonOptions: [{ value: "A", label: "Opción A" }] });
    fireEvent.click(screen.getByText("Seleccioná un motivo…"));
    fireEvent.click(screen.getByRole("option", { name: "Opción A" }));
    fireEvent.change(screen.getByPlaceholderText(/Explicá brevemente/), { target: { value: "msg" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith({ reasonCode: "A", publicMessage: "msg", internalMessage: "" });
  });

  it("muestra el error y se cancela por todas las vías", () => {
    const { onCancel } = setup({ error: "Falló" });
    expect(screen.getByText("Falló")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "k" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(4);
  });

  it("se bloquea mientras envía", () => {
    const { onCancel } = setup({ loading: true });
    expect(screen.getByText("Enviando…").closest("button")).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("TicketTransitionDialog", () => {
  const setup = (props = {}) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderWithProviders(<TicketTransitionDialog open title="Derivar" onCancel={onCancel} onConfirm={onConfirm} {...props} />);
    return { onCancel, onConfirm };
  };

  it("no renderiza nada cerrado", () => {
    renderWithProviders(<TicketTransitionDialog open={false} title="X" onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirma con comentario público por defecto", () => {
    const { onConfirm } = setup({ eyebrow: "Estado", description: "Desc", confirmation: "Pasará a Derivado", confirmLabel: "Derivar" });
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("Pasará a Derivado")).toBeInTheDocument();
    expect(screen.getByText("(opcional)")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Mensaje visible para el ciudadano…"), { target: { value: "  Hola  " } });
    fireEvent.click(screen.getByRole("button", { name: "Derivar" }));
    expect(onConfirm).toHaveBeenCalledWith({ comment: "Hola", visibility: "PUBLIC" });
  });

  it("cambia a comentario interno con sus textos propios", () => {
    const { onConfirm } = setup({ publicCommentLabel: "Vecino", internalCommentLabel: "Equipo", internalCommentPlaceholder: "Solo equipo" });
    fireEvent.click(screen.getByRole("button", { name: "Equipo" }));
    fireEvent.change(screen.getByPlaceholderText("Solo equipo"), { target: { value: "nota" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith({ comment: "nota", visibility: "INTERNAL" });
    fireEvent.click(screen.getByRole("button", { name: "Vecino" }));
    expect(screen.getByPlaceholderText("Mensaje visible para el ciudadano…")).toBeInTheDocument();
  });

  it("exige comentario cuando no es opcional", () => {
    const { onConfirm } = setup({ commentOptional: false, commentLabel: "Motivo" });
    const confirm = screen.getByRole("button", { name: "Confirmar" });
    expect(screen.getByText("Motivo")).toBeInTheDocument();
    expect(screen.queryByText("(opcional)")).not.toBeInTheDocument();
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Mensaje visible para el ciudadano…"), { target: { value: "  " } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Mensaje visible para el ciudadano…"), { target: { value: "ok" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("muestra selectores adicionales con ayuda y estado deshabilitado", async () => {
    const onChange = vi.fn();
    setup({
      fields: [
        { id: "area", label: "Área", value: "M1", options: [{ value: "M1", label: "Ciudadanos" }, { value: "M2", label: "Atención" }], onChange, helpText: "Elegí el área" },
        { id: "fixed", label: "Prioridad", value: "HIGH", options: [{ value: "HIGH", label: "Alta" }], disabled: true, helpText: "Definida por el tipo" },
        { id: "noHelp", label: "Sin ayuda", value: "A", options: [{ value: "A", label: "A" }] },
      ],
    });
    expect(screen.getByText("Elegí el área")).toBeInTheDocument();
    expect(screen.getByText("Definida por el tipo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ciudadanos"));
    fireEvent.click(screen.getByRole("option", { name: "Atención" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("M2"));
  });

  it("tolera un campo sin onChange", () => {
    setup({ fields: [{ id: "a", label: "Campo", value: "A", options: [{ value: "A", label: "Uno" }, { value: "B", label: "Dos" }] }] });
    fireEvent.click(screen.getByText("Uno"));
    fireEvent.click(screen.getByRole("option", { name: "Dos" }));
  });

  it("se cancela con Cancelar, X, Escape y el fondo", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "b" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(4);
  });
});
