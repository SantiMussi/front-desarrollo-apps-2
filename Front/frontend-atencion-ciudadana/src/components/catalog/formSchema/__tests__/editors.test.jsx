import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Toggle from "../Toggle";
import OptionsEditor from "../OptionsEditor";
import RiskRulesEditor from "../RiskRulesEditor";
import FieldCard from "../FieldCard";
import { TYPE_ICONS } from "../typeIcons";
import { emptyField, emptyOption, emptyRule } from "../formSchemaModel";

afterEach(() => vi.restoreAllMocks());

function OptionsHarness({ initial, error, spy }) {
  const [options, setOptions] = useState(initial);
  return (
    <>
      <OptionsEditor
        options={options}
        error={error}
        onChange={(next) => {
          spy?.(next);
          setOptions(next);
        }}
      />
      <output data-testid="state">{JSON.stringify(options.map((o) => [o.label, o.value]))}</output>
    </>
  );
}

const state = () => JSON.parse(screen.getByTestId("state").textContent);
const opt = (label, value, valueTouched = true) => ({ ...emptyOption(), label, value, valueTouched });

describe("typeIcons", () => {
  it("tiene un ícono por cada tipo de campo", () => {
    ["TEXT", "TEXTAREA", "SELECT", "BOOLEAN", "NUMBER", "DATE"].forEach((type) => expect(TYPE_ICONS[type]).toBeTruthy());
  });
});

describe("Toggle", () => {
  it("invierte su estado y respeta disabled", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle checked={false} onChange={onChange} label="Activo" />);
    const toggle = screen.getByRole("switch", { name: "Activo" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Toggle checked onChange={onChange} label="Activo" disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("envía false cuando estaba activo", () => {
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} label="x" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("OptionsEditor", () => {
  it("autogenera el valor desde el texto hasta que se edita a mano", () => {
    render(<OptionsHarness initial={[opt("", "", false), opt("Dos", "MANUAL", true)]} />);
    fireEvent.change(screen.getByLabelText("Texto de la opción 1"), { target: { value: "Más de 5" } });
    expect(state()[0]).toEqual(["Más de 5", "MAS_DE_5"]);
    fireEvent.change(screen.getByLabelText("Texto de la opción 2"), { target: { value: "Otro" } });
    expect(state()[1]).toEqual(["Otro", "MANUAL"]);
    fireEvent.change(screen.getByLabelText("Valor de la opción 1"), { target: { value: "CUSTOM" } });
    fireEvent.change(screen.getByLabelText("Texto de la opción 1"), { target: { value: "Cambio" } });
    expect(state()[0]).toEqual(["Cambio", "CUSTOM"]);
  });

  it("reordena, quita y agrega opciones", () => {
    render(<OptionsHarness initial={[opt("A", "A"), opt("B", "B"), opt("C", "C")]} error="Hay valores repetidos" />);
    const [firstUp] = screen.getAllByLabelText("Subir opción");
    const downs = screen.getAllByLabelText("Bajar opción");
    expect(firstUp).toBeDisabled();
    expect(downs[2]).toBeDisabled();
    fireEvent.click(downs[0]);
    expect(state().map((o) => o[0])).toEqual(["B", "A", "C"]);
    fireEvent.click(screen.getAllByLabelText("Subir opción")[2]);
    expect(state().map((o) => o[0])).toEqual(["B", "C", "A"]);
    fireEvent.click(screen.getAllByLabelText("Quitar opción")[1]);
    expect(state().map((o) => o[0])).toEqual(["B", "A"]);
    fireEvent.click(screen.getByText("Agregar opción"));
    expect(state()).toHaveLength(3);
    expect(screen.getByText("Hay valores repetidos")).toBeInTheDocument();
  });

  it("agrega opciones en lote descartando las vacías", () => {
    const spy = vi.fn();
    render(<OptionsHarness initial={[opt("", "", false), opt("Existente", "EXISTENTE")]} spy={spy} />);
    fireEvent.click(screen.getByText("Agregar varias a la vez"));
    const add = screen.getByRole("button", { name: "Agregar" });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Entre 2 y 5/), { target: { value: "Una\n\n  Entre 2 y 5  \n" } });
    fireEvent.click(add);
    expect(state()).toEqual([
      ["Existente", "EXISTENTE"],
      ["Una", "UNA"],
      ["Entre 2 y 5", "ENTRE_2_Y_5"],
    ]);
    expect(screen.queryByPlaceholderText(/Entre 2 y 5/)).not.toBeInTheDocument();
  });

  it("no hace nada con un lote de solo espacios y permite cancelar", () => {
    const spy = vi.fn();
    render(<OptionsHarness initial={[opt("A", "A")]} spy={spy} />);
    fireEvent.click(screen.getByText("Agregar varias a la vez"));
    fireEvent.change(screen.getByPlaceholderText(/Entre 2 y 5/), { target: { value: " \n \n" } });
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByPlaceholderText(/Entre 2 y 5/)).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Agregar varias a la vez"));
    fireEvent.click(screen.getByText("Agregar varias a la vez"));
    expect(screen.queryByPlaceholderText(/Entre 2 y 5/)).not.toBeInTheDocument();
  });
});

function RulesHarness({ field: initial, errors }) {
  const [field, setField] = useState(initial);
  return (
    <>
      <RiskRulesEditor field={field} errors={errors} onChange={(riskRules) => setField({ ...field, riskRules })} />
      <output data-testid="rules">{JSON.stringify(field.riskRules)}</output>
    </>
  );
}

const rules = () => JSON.parse(screen.getByTestId("rules").textContent);

describe("RiskRulesEditor", () => {
  it("muestra el estado vacío, la ayuda y agrega reglas por tipo", () => {
    render(<RulesHarness field={{ ...emptyField("BOOLEAN") }} />);
    expect(screen.getByText(/no modifica el riesgo/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("¿Cómo funcionan?"));
    expect(screen.getByText(/se suman \(o restan\) puntos/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("¿Cómo funcionan?"));
    expect(screen.queryByText(/se suman \(o restan\) puntos/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Agregar regla de riesgo"));
    expect(rules()).toHaveLength(1);
    expect(screen.getByText("es igual a")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Respuesta"), { target: { value: "false" } });
    expect(rules()[0].expected).toBe("false");
    fireEvent.change(screen.getByLabelText("Puntos de riesgo"), { target: { value: "-20" } });
    expect(rules()[0].riskIncrement).toBe("-20");
    fireEvent.click(screen.getByRole("switch", { name: "Regla activa" }));
    expect(rules()[0].active).toBe(false);
    expect(screen.getByText("Pausada")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Quitar regla"));
    expect(rules()).toEqual([]);
  });

  it("edita reglas de una lista con EQUALS e IN", () => {
    const options = [
      { uid: "o1", label: "Uno", value: "UNO", valueTouched: true },
      { uid: "o2", label: "", value: "DOS", valueTouched: true },
    ];
    render(<RulesHarness field={{ ...emptyField("SELECT"), options, riskRules: [{ ...emptyRule("SELECT"), expected: "missing:GONE" }] }} />);
    const select = screen.getByLabelText("Opción");
    expect(within(select).getByText("(opción eliminada)")).toBeInTheDocument();
    expect(within(select).getByText("(sin texto)")).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "o1" } });
    expect(rules()[0].expected).toBe("o1");

    fireEvent.change(screen.getByLabelText("Condición"), { target: { value: "IN" } });
    expect(rules()[0]).toMatchObject({ operator: "IN", expected: "", expectedList: [] });
    fireEvent.click(screen.getByRole("button", { name: "Uno" }));
    fireEvent.click(screen.getByRole("button", { name: "(sin texto)" }));
    expect(rules()[0].expectedList).toEqual(["o1", "o2"]);
    fireEvent.click(screen.getByRole("button", { name: "Uno" }));
    expect(rules()[0].expectedList).toEqual(["o2"]);
    expect(screen.getByRole("button", { name: "Uno" })).toHaveAttribute("aria-pressed", "false");
  });

  it("avisa cuando una regla IN referencia opciones eliminadas", () => {
    render(
      <RulesHarness
        field={{
          ...emptyField("SELECT"),
          options: [{ uid: "o1", label: "Uno", value: "UNO", valueTouched: true }],
          riskRules: [{ ...emptyRule("SELECT"), operator: "IN", expectedList: ["missing:X"] }],
        }}
        errors={{}}
      />
    );
    expect(screen.getByText("Incluye opciones eliminadas")).toBeInTheDocument();
  });

  it("edita cada operador numérico", () => {
    render(<RulesHarness field={{ ...emptyField("NUMBER"), riskRules: [emptyRule("NUMBER")] }} />);
    const condition = () => screen.getByLabelText("Condición");
    fireEvent.change(screen.getByLabelText("Número"), { target: { value: "4" } });
    expect(rules()[0].expected).toBe("4");

    fireEvent.change(condition(), { target: { value: "IN" } });
    fireEvent.change(screen.getByLabelText("Números separados por coma"), { target: { value: "1, 2" } });
    expect(rules()[0].expected).toBe("1, 2");

    fireEvent.change(condition(), { target: { value: "BETWEEN" } });
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "9" } });
    expect(rules()[0]).toMatchObject({ valueFrom: "1", valueTo: "9" });

    fireEvent.change(condition(), { target: { value: "GREATER_THAN" } });
    fireEvent.change(screen.getByLabelText("Mayor que"), { target: { value: "3" } });
    expect(rules()[0].valueFrom).toBe("3");

    fireEvent.change(condition(), { target: { value: "LESS_THAN" } });
    fireEvent.change(screen.getByLabelText("Menor que"), { target: { value: "8" } });
    expect(rules()[0].valueTo).toBe("8");
  });

  it("muestra errores por regla y tolera operadores desconocidos", () => {
    const rule = { ...emptyRule("NUMBER"), operator: "WEIRD" };
    render(<RulesHarness field={{ ...emptyField("NUMBER"), riskRules: [rule] }} errors={{ [rule.uid]: "Operador inválido." }} />);
    expect(screen.getByText("Operador inválido.")).toBeInTheDocument();
    expect(screen.getByLabelText("Condición")).toBeInTheDocument();
  });

  it("muestra el operador fijo cuando el tipo tiene uno solo", () => {
    render(<RulesHarness field={{ ...emptyField("BOOLEAN"), riskRules: [emptyRule("BOOLEAN")] }} />);
    expect(screen.queryByLabelText("Condición")).not.toBeInTheDocument();
  });

  it("tolera un tipo sin operadores definidos", () => {
    render(<RulesHarness field={{ ...emptyField("DATE"), riskRules: [{ ...emptyRule("DATE"), operator: "EQUALS" }] }} />);
    expect(screen.getByText("es igual a")).toBeInTheDocument();
  });
});

function CardHarness({ initial, errors, extra = {} }) {
  const [field, setField] = useState(initial);
  const [open, setOpen] = useState(true);
  const props = {
    index: 0,
    total: 3,
    errors,
    onMove: vi.fn(),
    onRemove: vi.fn(),
    ...extra,
  };
  return (
    <FieldCard
      field={field}
      open={open}
      onToggleOpen={() => setOpen((value) => !value)}
      onChange={(patch) => setField((current) => ({ ...current, ...patch }))}
      {...props}
    />
  );
}

describe("FieldCard", () => {
  it("resume el campo cerrado y lo expande", () => {
    const field = { ...emptyField("TEXT"), label: "Nombre", code: "nombre", required: true };
    const { container } = render(<CardHarness initial={{ ...field, riskRules: [] }} />);
    expect(container.querySelector("article")).toHaveAttribute("id", `field-${field.uid}`);
    fireEvent.click(screen.getByRole("button", { name: /1\. Nombre/ }));
    expect(screen.queryByText("Pregunta que ve el vecino")).not.toBeInTheDocument();
    expect(screen.getByText("Obligatorio")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /1\. Nombre/ }));
    expect(screen.getByText("Pregunta que ve el vecino")).toBeInTheDocument();
  });

  it("muestra placeholders, código autogenerado y contador de reglas", () => {
    const field = {
      ...emptyField("NUMBER"),
      label: "",
      riskRules: [{ ...emptyRule("NUMBER"), active: true }, { ...emptyRule("NUMBER"), active: false }],
    };
    render(<CardHarness initial={field} errors={{ label: "Falta", code: "Código inválido" }} />);
    expect(screen.getByText("Campo sin pregunta")).toBeInTheDocument();
    expect(screen.getByText("1 regla")).toBeInTheDocument();
    expect(screen.getByText("Revisar")).toBeInTheDocument();
    expect(screen.getByText("Falta")).toBeInTheDocument();
    expect(screen.getByText("Código inválido")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "¿Cuántos hay?" } });
    expect(screen.getByPlaceholderText("cantidadLuminarias")).toHaveValue("cuantosHay");
    fireEvent.change(screen.getByPlaceholderText("cantidadLuminarias"), { target: { value: "propio" } });
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Otra pregunta" } });
    expect(screen.getByPlaceholderText("cantidadLuminarias")).toHaveValue("propio");
  });

  it("pluraliza reglas y muestra ayuda de código sin error", () => {
    const field = {
      ...emptyField("BOOLEAN"),
      label: "Riesgo",
      code: "riesgo",
      riskRules: [emptyRule("BOOLEAN"), emptyRule("BOOLEAN")],
    };
    render(<CardHarness initial={field} />);
    expect(screen.getByText("2 reglas")).toBeInTheDocument();
    expect(screen.getByText(/Identifica la respuesta en el ticket/)).toBeInTheDocument();
    expect(screen.queryByText("Revisar")).not.toBeInTheDocument();
  });

  it("cambia el estado obligatorio y 'no sé'", () => {
    render(<CardHarness initial={{ ...emptyField("TEXT"), label: "x", code: "x" }} />);
    fireEvent.click(screen.getByRole("switch", { name: "Campo obligatorio" }));
    expect(screen.queryByText("Obligatorio")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /No sé/ }));
    expect(screen.getByRole("switch", { name: /No sé/ })).toHaveAttribute("aria-checked", "true");
  });

  it("muestra texto de ayuda según el tipo y no lo muestra en tipos sin placeholder", () => {
    const { rerender } = render(<CardHarness initial={{ ...emptyField("TEXT"), label: "x", code: "x" }} />);
    fireEvent.change(screen.getByPlaceholderText(/esquina, plaza/), { target: { value: "ayuda" } });
    expect(screen.getByPlaceholderText(/esquina, plaza/)).toHaveValue("ayuda");
    rerender(<CardHarness key="sel" initial={{ ...emptyField("SELECT"), label: "x", code: "x" }} />);
    expect(screen.getByText("Texto del selector vacío")).toBeInTheDocument();
    expect(screen.getByText("Opciones de la lista")).toBeInTheDocument();
    rerender(<CardHarness key="date" initial={{ ...emptyField("DATE"), label: "x", code: "x" }} />);
    expect(screen.queryByText(/Texto de ayuda dentro/)).not.toBeInTheDocument();
    expect(screen.getByText(/no pueden influir en el riesgo/)).toBeInTheDocument();
    rerender(<CardHarness key="bool" initial={{ ...emptyField("BOOLEAN"), label: "x", code: "x" }} />);
    expect(screen.getByText("Reglas de riesgo")).toBeInTheDocument();
  });

  it("cambia el tipo sin confirmar cuando no hay contenido y reinicia opciones", () => {
    render(<CardHarness initial={{ ...emptyField("TEXT"), label: "x", code: "x", placeholder: "algo" }} />);
    const typeSelect = screen.getByLabelText(/Tipo de campo/);
    fireEvent.change(typeSelect, { target: { value: "TEXT" } });
    fireEvent.change(typeSelect, { target: { value: "SELECT" } });
    expect(screen.getByText("Opciones de la lista")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Texto de la opción/)).toHaveLength(2);
    fireEvent.change(typeSelect, { target: { value: "DATE" } });
    expect(screen.queryByText("Opciones de la lista")).not.toBeInTheDocument();
  });

  it("pide confirmación al cambiar de tipo si se perderían datos", () => {
    const confirm = vi.spyOn(window, "confirm");
    const field = {
      ...emptyField("SELECT"),
      label: "x",
      code: "x",
      options: [{ uid: "o1", label: "Uno", value: "UNO", valueTouched: true }],
    };
    render(<CardHarness initial={field} />);
    const typeSelect = screen.getByLabelText(/Tipo de campo/);
    confirm.mockReturnValueOnce(false);
    fireEvent.change(typeSelect, { target: { value: "TEXT" } });
    expect(screen.getByText("Opciones de la lista")).toBeInTheDocument();
    confirm.mockReturnValueOnce(true);
    fireEvent.change(typeSelect, { target: { value: "TEXT" } });
    expect(screen.queryByText("Opciones de la lista")).not.toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("confirma con reglas de riesgo existentes", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CardHarness initial={{ ...emptyField("BOOLEAN"), label: "x", code: "x", riskRules: [emptyRule("BOOLEAN")] }} />);
    fireEvent.change(screen.getByLabelText(/Tipo de campo/), { target: { value: "NUMBER" } });
    expect(confirm).toHaveBeenCalled();
    expect(screen.queryByText("1 regla")).not.toBeInTheDocument();
  });

  it("mueve y elimina el campo con confirmación", () => {
    const onMove = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(
      <CardHarness initial={{ ...emptyField("TEXT"), label: "x", code: "x" }} extra={{ onMove, onRemove, index: 1 }} />
    );
    fireEvent.click(screen.getByLabelText("Subir campo"));
    fireEvent.click(screen.getByLabelText("Bajar campo"));
    expect(onMove).toHaveBeenNthCalledWith(1, -1);
    expect(onMove).toHaveBeenNthCalledWith(2, 1);
    fireEvent.click(screen.getByLabelText("Eliminar campo"));
    fireEvent.click(screen.getByText("No"));
    expect(onRemove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Eliminar campo"));
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onRemove).toHaveBeenCalledOnce();
    rerender(<CardHarness key="edges" initial={{ ...emptyField("TEXT"), label: "x", code: "x" }} extra={{ index: 0, total: 1 }} />);
    expect(screen.getByLabelText("Subir campo")).toBeDisabled();
    expect(screen.getByLabelText("Bajar campo")).toBeDisabled();
  });
});
