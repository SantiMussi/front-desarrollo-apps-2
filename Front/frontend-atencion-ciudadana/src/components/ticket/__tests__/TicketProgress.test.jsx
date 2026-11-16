import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TicketProgress from "../TicketProgress";
import { progressStepIndex } from "../../../constants/citizenStatusGuide";

describe("TicketProgress", () => {
  it("marca el paso actual y los anteriores como completados", () => {
    render(<TicketProgress status="IN_PROGRESS" history={[]} />);
    expect(screen.getByText("Estamos trabajando en esto")).toBeInTheDocument();
    expect(screen.getByText("En marcha").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Recibido").closest("li")).not.toHaveAttribute("aria-current");
  });

  it("muestra el cierre como paso completado", () => {
    render(<TicketProgress status="CLOSED" history={[]} />);
    expect(screen.getByText("Reclamo cerrado")).toBeInTheDocument();
    expect(screen.getByText("Cerrado").closest("li")).not.toHaveAttribute("aria-current");
  });

  it("en información pendiente conserva el paso previo del historial", () => {
    const history = [{ newStatus: "REGISTERED" }, { newStatus: "IN_PROGRESS" }, { newStatus: "PENDING_INFORMATION" }];
    expect(progressStepIndex("PENDING_INFORMATION", history)).toBe(2);
    expect(progressStepIndex("PENDING_INFORMATION", [])).toBe(1);
    render(<TicketProgress status="PENDING_INFORMATION" history={history} />);
    expect(screen.getByText("Necesitamos un dato tuyo")).toBeInTheDocument();
    expect(screen.getByText("En marcha").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it.each(["DUPLICATE", "CANCELLED"])("%s no dibuja pasos, solo el mensaje", (status) => {
    render(<TicketProgress status={status} history={[]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Estado de tu reclamo" })).toBeInTheDocument();
  });

  it("no renderiza nada con un estado desconocido", () => {
    const { container } = render(<TicketProgress status="OTHER" history={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
