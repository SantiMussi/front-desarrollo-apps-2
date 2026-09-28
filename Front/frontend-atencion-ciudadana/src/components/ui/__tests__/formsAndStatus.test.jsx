import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FormField from "../FormField";
import PublicTicketStatus from "../PublicTicketStatus";
import RequestInformationDialog from "../RequestInformationDialog";
import ResolveTicketDialog from "../ResolveTicketDialog";

describe("FormField", () => {
  const options = [
    { value: "a", label: "Árbol" },
    { value: "b", label: "Bache" },
  ];

  it("renderiza un input de texto con etiqueta, obligatorio y error", () => {
    const onChange = vi.fn();
    render(<FormField label="Nombre" name="name" value="Ana" onChange={onChange} required error="Requerido" placeholder="Tu nombre" />);
    const input = screen.getByLabelText(/Nombre/);
    expect(input).toHaveValue("Ana");
    expect(input).toBeRequired();
    expect(input).toHaveClass("border-red-300");
    expect(screen.getByText("Requerido")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Luz" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("soporta otros tipos nativos de input y deshabilitado", () => {
    render(<FormField label="Fecha" name="date" type="date" value="" onChange={() => {}} disabled />);
    expect(screen.getByLabelText("Fecha")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Fecha")).toBeDisabled();
    expect(screen.getByLabelText("Fecha")).toHaveClass("border-neutral-200");
  });

  it.each([
    ["smalltext", 1],
    ["textarea", 4],
  ])("renderiza el tipo %s como textarea de %i filas", (type, rows) => {
    render(<FormField label="Detalle" name="detail" type={type} value="x" onChange={() => {}} required error="Falta" />);
    expect(screen.getByLabelText(/Detalle/)).toHaveAttribute("rows", String(rows));
    expect(screen.getByText("Falta")).toBeInTheDocument();
  });

  it("los textarea funcionan sin error ni obligatoriedad", () => {
    render(<FormField label="A" name="a" type="textarea" value="" onChange={() => {}} />);
    render(<FormField label="B" name="b" type="smalltext" value="" onChange={() => {}} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renderiza un select nativo", () => {
    const onChange = vi.fn();
    render(<FormField label="Tipo" name="kind" type="select" value="" onChange={onChange} options={options} required error="Elegí" />);
    fireEvent.change(screen.getByLabelText(/Tipo/), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText("Elegí")).toBeInTheDocument();
    render(<FormField label="Otro" name="other" type="select" value="" onChange={() => {}} />);
    expect(screen.getAllByText("Seleccionar...")).toHaveLength(2);
  });

  it("renderiza un booleano Sí/No", () => {
    const onChange = vi.fn();
    const { rerender } = render(<FormField label="¿Hay riesgo?" name="risk" type="boolean" value="true" onChange={onChange} required error="Falta" />);
    expect(screen.getByRole("button", { name: "Sí" })).toHaveClass("text-[#D63031]");
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(onChange).toHaveBeenCalledWith({ target: { name: "risk", value: "false" } });
    expect(screen.getByText("Falta")).toBeInTheDocument();
    rerender(<FormField label="¿Hay riesgo?" name="risk" type="boolean" value={false} onChange={onChange} disabled />);
    expect(screen.getByRole("button", { name: "No" })).toHaveClass("text-[#D63031]");
    expect(screen.getByRole("button", { name: "Sí" })).toBeDisabled();
  });

  describe("searchable-select", () => {
    const setup = (props = {}) => {
      const onChange = vi.fn();
      render(<FormField label="Barrio" name="hood" type="searchable-select" value="" onChange={onChange} options={options} {...props} />);
      return onChange;
    };

    it("muestra el placeholder y elige una opción", () => {
      const onChange = setup({ required: true, placeholder: "Elegí un barrio" });
      expect(screen.getByText("Elegí un barrio")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Elegí un barrio"));
      fireEvent.click(screen.getByRole("button", { name: "Bache" }));
      expect(onChange).toHaveBeenCalledWith({ target: { name: "hood", value: "b" } });
      expect(screen.queryByPlaceholderText("Buscar...")).not.toBeInTheDocument();
    });

    it("usa el placeholder por defecto y marca la opción elegida", () => {
      setup({ value: "a" });
      expect(screen.getAllByText("Árbol").length).toBeGreaterThan(0);
      fireEvent.click(screen.getAllByRole("button")[0]);
      expect(screen.getAllByRole("button", { name: "Árbol" })[1]).toHaveClass("text-[#D63031]");
    });

    it("cae al texto por defecto sin selección ni placeholder", () => {
      setup();
      expect(screen.getByText("Seleccionar...")).toBeInTheDocument();
    });

    it("filtra ignorando tildes y mayúsculas, limpia y muestra el vacío", () => {
      setup({ error: "Obligatorio" });
      fireEvent.click(screen.getByText("Seleccionar..."));
      const search = screen.getByPlaceholderText("Buscar...");
      fireEvent.change(search, { target: { value: "ARBOL" } });
      expect(screen.getByRole("button", { name: "Árbol" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Bache" })).not.toBeInTheDocument();
      fireEvent.change(search, { target: { value: "zzz" } });
      expect(screen.getByText("No se encontraron resultados")).toBeInTheDocument();
      const clear = screen.getAllByRole("button").find((button) => button.querySelector(".lucide-x"));
      fireEvent.click(clear);
      expect(screen.getByRole("button", { name: "Bache" })).toBeInTheDocument();
      expect(screen.getByText("Obligatorio")).toBeInTheDocument();
    });

    it("cierra al hacer clic afuera y respeta disabled", () => {
      const { container } = render(<div><FormField label="Barrio" name="h" type="searchable-select" value="" onChange={() => {}} options={options} /><p>afuera</p></div>);
      fireEvent.click(container.querySelector("button"));
      expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument();
      fireEvent.mouseDown(screen.getByPlaceholderText("Buscar..."));
      expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument();
      fireEvent.mouseDown(screen.getByText("afuera"));
      expect(screen.queryByPlaceholderText("Buscar...")).not.toBeInTheDocument();
    });

    it("no abre si está deshabilitado", () => {
      setup({ disabled: true });
      fireEvent.click(screen.getByText("Seleccionar..."));
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});

describe("PublicTicketStatus", () => {
  const base = {
    publicId: "TK-001",
    summary: "Bache en la calle",
    status: "IN_PROGRESS",
    requestType: { name: "Bacheo" },
    category: { name: "Vía pública" },
    subcategory: { name: "Calzada" },
    createdAt: "2026-03-10T12:00:00Z",
    statusChangedAt: "2026-03-11T15:30:00Z",
    sla: { resolutionDueAt: "2026-03-20T12:00:00Z" },
  };

  it("no renderiza sin ticket", () => {
    const { container } = render(<PublicTicketStatus ticket={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra datos, el avance y la resolución estimada de un ticket abierto", () => {
    render(<PublicTicketStatus ticket={base} />);
    expect(screen.getByText("TK-001")).toBeInTheDocument();
    expect(screen.getByText("Bache en la calle")).toBeInTheDocument();
    expect(screen.getByText("Bacheo")).toBeInTheDocument();
    expect(screen.getByText("Vía pública")).toBeInTheDocument();
    expect(screen.getByText("Calzada")).toBeInTheDocument();
    expect(screen.getByText("Resolución estimada")).toBeInTheDocument();
    expect(screen.getAllByText("En gestión").length).toBeGreaterThan(0);
  });

  it("usa currentStatus como alternativa y no muestra la fecha estimada si está cerrado", () => {
    render(<PublicTicketStatus ticket={{ ...base, status: undefined, currentStatus: "RESOLVED" }} />);
    expect(screen.queryByText("Resolución estimada")).not.toBeInTheDocument();
    expect(screen.getByText("Resuelto", { selector: "span.rounded-md" })).toBeInTheDocument();
  });

  it("oculta la fecha estimada cuando no hay SLA y muestra guiones para datos faltantes", () => {
    render(<PublicTicketStatus ticket={{ publicId: "TK-2", summary: "x", status: "REGISTERED" }} />);
    expect(screen.queryByText("Resolución estimada")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(5);
  });

  it.each([
    ["CANCELLED", /fue cancelada/],
    ["DUPLICATE", /duplicada de otro reclamo/],
  ])("el estado %s muestra un aviso en lugar del avance", (status, pattern) => {
    render(<PublicTicketStatus ticket={{ ...base, status }} />);
    expect(screen.getByText(pattern)).toBeInTheDocument();
  });

  it("usa el paso inicial para estados desconocidos", () => {
    render(<PublicTicketStatus ticket={{ ...base, status: "RARO" }} />);
    expect(screen.getByText("RARO")).toBeInTheDocument();
  });
});

describe("RequestInformationDialog", () => {
  const setup = (props = {}) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<RequestInformationDialog ticketPublicId="TK-9" onCancel={onCancel} onConfirm={onConfirm} {...props} />);
    return { onCancel, onConfirm };
  };

  it("exige el mensaje para el ciudadano y envía valores recortados", () => {
    const { onConfirm } = setup();
    const confirm = screen.getByRole("button", { name: /Solicitar información/ });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Explicá qué información/), { target: { value: "  ¿Podés enviar una foto?  " } });
    fireEvent.change(screen.getByPlaceholderText(/Visible solo para el equipo/), { target: { value: " nota " } });
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({ messageForCitizen: "¿Podés enviar una foto?", internalMessage: "nota" });
    expect(screen.getByText(/TK-9/)).toBeInTheDocument();
  });

  it("muestra el error y se cancela por todas las vías", () => {
    const { onCancel } = setup({ error: "Falló" });
    expect(screen.getByText("Falló")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "q" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(4);
  });

  it("bloquea todo mientras envía", () => {
    const { onCancel } = setup({ loading: true });
    expect(screen.getByText("Enviando…").closest("button")).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("ResolveTicketDialog", () => {
  const setup = (props = {}) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ResolveTicketDialog ticketPublicId="TK-5" onCancel={onCancel} onConfirm={onConfirm} {...props} />);
    return { onCancel, onConfirm };
  };
  const pick = (ariaOrPlaceholder, optionName) => {
    fireEvent.click(screen.getByText(ariaOrPlaceholder));
    fireEvent.click(screen.getByRole("option", { name: optionName }));
  };

  it("resuelve manualmente eligiendo tipo y mensaje", () => {
    const { onConfirm } = setup();
    const confirm = screen.getByRole("button", { name: "Confirmar resolución" });
    expect(screen.getByText("Marcar como resuelto")).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    pick("Seleccionar…", "Acción completada");
    fireEvent.change(screen.getByPlaceholderText(/Explicá brevemente/), { target: { value: "  Listo  " } });
    fireEvent.change(screen.getByPlaceholderText(/Visible solo para el equipo/), { target: { value: " interno " } });
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({
      type: "ACTION_COMPLETED",
      publicMessage: "Listo",
      internalMessage: "interno",
      source: "manual",
    });
  });

  it("en modo simulador precarga tipo y mensajes desde la respuesta del área", () => {
    const { onConfirm } = setup({ mode: "simulator" });
    expect(screen.getByText("Registrar respuesta del área", { selector: "h2" })).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Registrar respuesta del área" });
    expect(confirm).toBeDisabled();
    pick("Seleccioná la respuesta del área…", "El área ejecutó el trabajo solicitado");
    expect(screen.getByText(/Podés ajustar el resultado/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Explicá brevemente/).value).toContain("intervención solicitada");
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ type: "ACTION_COMPLETED", source: "simulator" }));
  });

  it("actualiza tipo y mensajes al cambiar la respuesta simulada", () => {
    setup({ mode: "simulator" });
    pick("Seleccioná la respuesta del área…", "El área respondió la consulta");
    expect(screen.getByPlaceholderText(/Explicá brevemente/).value).toContain("respondió tu consulta");
    if (!screen.queryByRole("listbox")) fireEvent.click(document.querySelectorAll('[aria-haspopup="listbox"]')[0]);
    fireEvent.click(screen.getByRole("option", { name: "El área tomó conocimiento" }));
    expect(screen.getByPlaceholderText(/Visible solo para el equipo/).value).toContain("tomado conocimiento");
  });

  it("muestra el error de la operación", () => {
    setup({ error: "No se pudo" });
    expect(screen.getByText("No se pudo")).toBeInTheDocument();
  });

  it("explica por qué no se puede resolver en modos no elegibles", () => {
    const { onCancel } = setup({ mode: "blocked", incompatibleReason: "Todavía está en revisión" });
    expect(screen.getByText("No se puede resolver en este estado")).toBeInTheDocument();
    expect(screen.getByText("Todavía está en revisión")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confirmar/ })).not.toBeInTheDocument();
    screen.getAllByRole("button", { name: "Cerrar" }).forEach((button) => fireEvent.click(button));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("usa el texto por defecto cuando no hay motivo", () => {
    setup({ mode: "blocked" });
    expect(screen.getByText(/no está en un estado compatible/)).toBeInTheDocument();
  });

  it("se cancela con Escape y el fondo, y se bloquea mientras carga", () => {
    const first = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "x" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(first.onCancel).toHaveBeenCalledTimes(3);
  });

  it("no permite cancelar mientras registra", () => {
    const { onCancel } = setup({ loading: true });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByText("Registrando…").closest("button")).toBeDisabled();
  });

  it("muestra el texto de carga del simulador", () => {
    setup({ mode: "simulator", loading: true });
    expect(screen.getByText("Registrando…")).toBeInTheDocument();
  });
});
