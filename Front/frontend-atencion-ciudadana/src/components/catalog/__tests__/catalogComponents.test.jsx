import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CatalogBreadcrumb from "../CatalogBreadcrumb";
import CatalogCreateButton from "../CatalogCreateButton";
import CatalogDependencyNotice from "../CatalogDependencyNotice";
import CatalogEntityFormDialog from "../CatalogEntityFormDialog";
import CatalogEntityTable from "../CatalogEntityTable";
import CatalogRowActions from "../CatalogRowActions";
import CatalogStatusBadge from "../CatalogStatusBadge";

describe("CatalogBreadcrumb", () => {
  it("enlaza los niveles intermedios y marca el último", () => {
    render(
      <MemoryRouter>
        <CatalogBreadcrumb
          items={[
            { label: "Catálogo", to: "/agente/catalogo" },
            { label: "Sin enlace" },
            { label: "Actual", to: "/x" },
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/agente/catalogo");
    expect(screen.getByText("Sin enlace").closest("a")).toBeNull();
    expect(screen.getByText("Actual").closest("a")).toBeNull();
    expect(screen.getByText("Actual")).toHaveClass("font-semibold");
  });
});

describe("CatalogCreateButton", () => {
  it("dispara onClick y muestra el motivo cuando está deshabilitado", () => {
    const onClick = vi.fn();
    const { rerender } = render(<CatalogCreateButton label="Nuevo" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Nuevo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button")).not.toHaveAttribute("title");
    rerender(<CatalogCreateButton label="Nuevo" onClick={onClick} disabled disabledReason="Inactiva" />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("title", "Inactiva");
  });
});

describe("CatalogDependencyNotice / CatalogStatusBadge", () => {
  it("aplica el tono informativo o de advertencia", () => {
    const { container, rerender } = render(<CatalogDependencyNotice>Aviso</CatalogDependencyNotice>);
    expect(container.firstChild).toHaveClass("bg-blue-50");
    rerender(<CatalogDependencyNotice tone="warning">Cuidado</CatalogDependencyNotice>);
    expect(container.firstChild).toHaveClass("bg-amber-50");
    expect(screen.getByText("Cuidado")).toBeInTheDocument();
  });

  it("muestra Activo o Inactivo", () => {
    const { rerender } = render(<CatalogStatusBadge active />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    rerender(<CatalogStatusBadge active={false} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });
});

describe("CatalogEntityTable", () => {
  const columns = [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Código", render: (item) => `#${item.code}` },
  ];

  it("cubre los estados de carga, error y vacío", () => {
    const { container, rerender } = render(<CatalogEntityTable items={[]} loading columns={columns} />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    rerender(<CatalogEntityTable items={[]} error="Falló" columns={columns} />);
    expect(screen.getByText("Falló")).toBeInTheDocument();
    rerender(<CatalogEntityTable items={[]} emptyMessage="Nada por acá" columns={columns} />);
    expect(screen.getByText("Nada por acá")).toBeInTheDocument();
  });

  it("renderiza filas con render personalizado y clic opcional", () => {
    const onRowClick = vi.fn();
    const items = [{ id: 1, name: "Alumbrado", code: "A" }];
    const { rerender } = render(<CatalogEntityTable items={items} columns={columns} />);
    expect(screen.getByText("Alumbrado")).toBeInTheDocument();
    expect(screen.getByText("#A")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Alumbrado"));
    rerender(<CatalogEntityTable items={items} columns={columns} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Alumbrado"));
    expect(onRowClick).toHaveBeenCalledWith(items[0]);
  });
});

describe("CatalogRowActions", () => {
  it("edita y activa/desactiva sin propagar el clic a la fila", () => {
    const onEdit = vi.fn();
    const onToggleActive = vi.fn();
    const rowClick = vi.fn();
    const { rerender } = render(
      <div onClick={rowClick}>
        <CatalogRowActions active onEdit={onEdit} onToggleActive={onToggleActive} />
      </div>
    );
    fireEvent.click(screen.getByLabelText("Editar"));
    fireEvent.click(screen.getByLabelText("Desactivar"));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onToggleActive).toHaveBeenCalledOnce();
    expect(rowClick).not.toHaveBeenCalled();
    rerender(<CatalogRowActions active={false} onEdit={onEdit} onToggleActive={onToggleActive} />);
    expect(screen.getByLabelText("Activar")).toBeInTheDocument();
  });

  it("explica por qué están deshabilitadas las acciones y muestra el estado ocupado", () => {
    const { rerender, container } = render(
      <CatalogRowActions
        active
        editDisabled
        editDisabledReason="No se puede editar"
        toggleDisabled
        toggleDisabledReason="No se puede activar"
      />
    );
    expect(screen.getByLabelText("No se puede editar")).toBeDisabled();
    expect(screen.getByLabelText("No se puede activar")).toBeDisabled();
    rerender(<CatalogRowActions active={false} busy />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.getByLabelText("Editar")).toBeDisabled();
  });
});

describe("CatalogEntityFormDialog", () => {
  const fields = [
    { name: "subcategoryId", label: "Subcategoría", locked: true, lockedLabel: "Alumbrado" },
    { name: "parentId", label: "Padre", locked: true },
    { name: "name", label: "Nombre", type: "text", required: true, maxLength: 50, placeholder: "Nombre" },
    { name: "note", label: "Nota", type: "text" },
    { name: "description", label: "Descripción", type: "textarea", required: true },
    { name: "kind", label: "Tipo", type: "select", required: true, options: [{ value: "A", label: "Opción A" }] },
    { name: "factor", label: "Factor", type: "number", required: true, min: 0, max: 1, step: 0.1, hint: "Entre 0 y 1" },
    { name: "extra", label: "Extra", type: "number" },
    { name: "flag", label: "Activo", type: "boolean" },
  ];
  const initialValues = { subcategoryId: 7, parentId: 9, name: "Inicial", description: "Desc", kind: "A", factor: "0.5", flag: true };

  const setup = (props = {}) => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(
      <CatalogEntityFormDialog
        title="Editar"
        subtitle="Sub"
        fields={fields}
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        onSubmit={onSubmit}
        onCancel={onCancel}
        {...props}
      />
    );
    return { onSubmit, onCancel };
  };

  it("arma el payload tipado respetando campos bloqueados y opcionales vacíos", () => {
    const { onSubmit } = setup();
    expect(screen.getByText("Sub")).toBeInTheDocument();
    expect(screen.getByText("Alumbrado")).toBeInTheDocument();
    expect(screen.getByText("Entre 0 y 1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "  Nuevo nombre  " } });
    fireEvent.change(screen.getByLabelText(/^Descripción/), { target: { value: "Otra" } });
    fireEvent.change(screen.getByLabelText(/^Tipo/), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText(/^Factor/), { target: { value: "0.8" } });
    fireEvent.change(screen.getByLabelText(/^Extra/), { target: { value: "3" } });
    fireEvent.click(screen.getByLabelText("Activo"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onSubmit).toHaveBeenCalledWith({
      subcategoryId: 7,
      parentId: 9,
      name: "Nuevo nombre",
      note: null,
      description: "Otra",
      kind: "A",
      factor: 0.8,
      extra: 3,
      flag: false,
    });
  });

  it("envía null en números vacíos y no envía si falta un campo obligatorio", () => {
    const { onSubmit } = setup({ initialValues: { ...initialValues, name: "" } });
    const submit = screen.getByRole("button", { name: "Guardar cambios" });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "Listo" } });
    fireEvent.change(screen.getByLabelText(/^Extra/), { target: { value: "" } });
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ extra: null, name: "Listo" }));
  });

  it("acepta valores iniciales ausentes", () => {
    const onSubmit = vi.fn();
    render(
      <CatalogEntityFormDialog
        title="Nuevo"
        fields={[{ name: "n", label: "N", type: "text" }, { name: "b", label: "B", type: "boolean" }]}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSubmit).toHaveBeenCalledWith({ n: null, b: false });
  });

  it("cancela con el botón, la X, Escape y el fondo, y muestra errores", () => {
    const { onCancel } = setup({ error: "Ya existe" });
    expect(screen.getByText("Ya existe")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(4);
  });

  it("bloquea todo mientras guarda", () => {
    const { onCancel } = setup({ loading: true });
    expect(screen.getByText("Guardando…")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByLabelText(/^Nombre/)).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
