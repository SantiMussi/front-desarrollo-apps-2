import { describe, expect, it } from "vitest";
import {
  FIELD_TYPES,
  emptyField,
  emptyOption,
  emptyRule,
  fieldFromApi,
  fieldsFromApi,
  fieldsToApi,
  newUid,
  ruleToApi,
  slugifyCode,
  slugifyOptionValue,
  snapshot,
  validateFields,
} from "../formSchemaModel";

const select = (overrides = {}) => ({
  ...emptyField("SELECT"),
  code: "tipo",
  label: "Tipo",
  options: [
    { uid: "o1", label: "Uno", value: "UNO", valueTouched: true },
    { uid: "o2", label: "Dos", value: "DOS", valueTouched: true },
    { uid: "o3", label: "Tres", value: "TRES", valueTouched: true },
  ],
  ...overrides,
});

const rule = (type, overrides = {}) => ({ ...emptyRule(type), ...overrides });

describe("catálogo de tipos y utilidades", () => {
  it("expone los seis tipos soportados por el backend", () => {
    expect(FIELD_TYPES.map((type) => type.value)).toEqual(["TEXT", "TEXTAREA", "SELECT", "BOOLEAN", "NUMBER", "DATE"]);
  });

  it("genera uids únicos", () => {
    expect(newUid()).not.toBe(newUid());
  });

  it.each([
    ["¿Cuántas luminarias están afectadas?", "cuantasLuminariasEstanAfectadas"],
    ["   ", ""],
    [null, ""],
    ["123 vecinos", "campo123Vecinos"],
    ["Nombre", "nombre"],
    ["a".repeat(150), "a".repeat(100)],
  ])("slugifyCode(%j) -> %j", (label, expected) => {
    expect(slugifyCode(label)).toBe(expected);
  });

  it.each([
    ["Sí, hay riesgo", "SI_HAY_RIESGO"],
    ["__ninguna__", "NINGUNA"],
    [undefined, ""],
  ])("slugifyOptionValue(%j) -> %j", (label, expected) => {
    expect(slugifyOptionValue(label)).toBe(expected);
  });

  it("crea opciones, reglas y campos vacíos con valores por defecto", () => {
    expect(emptyOption()).toMatchObject({ label: "", value: "", valueTouched: false });
    expect(emptyRule("BOOLEAN")).toMatchObject({ expected: "true", operator: "EQUALS", active: true });
    expect(emptyRule("NUMBER").expected).toBe("");
    expect(emptyField("SELECT").options).toHaveLength(2);
    expect(emptyField().type).toBe("TEXT");
    expect(emptyField("NUMBER").options).toEqual([]);
  });
});

describe("fieldsFromApi", () => {
  it("ordena por displayOrder y traduce reglas de cada tipo", () => {
    const fields = fieldsFromApi({
      fields: [
        {
          code: "b",
          label: "B",
          type: "SELECT",
          required: true,
          displayOrder: 2,
          config: {
            placeholder: "Elegí",
            options: [
              { label: "Uno", value: "UNO" },
              { label: "Dos", value: "DOS" },
            ],
          },
          riskRules: [
            { operator: "EQUALS", expectedValue: "UNO", riskIncrement: 5 },
            { operator: "IN", expectedValue: ["UNO", "MISSING"], riskIncrement: -3, active: false },
          ],
        },
        {
          code: "a",
          label: "A",
          type: "NUMBER",
          displayOrder: 1,
          riskRules: [
            { operator: "EQUALS", expectedValue: 4, riskIncrement: 1 },
            { operator: "IN", expectedValue: [1, 2], riskIncrement: 1 },
            { operator: "BETWEEN", valueFrom: 1, valueTo: 9, riskIncrement: 1 },
          ],
        },
      ],
    });

    expect(fields.map((field) => field.code)).toEqual(["a", "b"]);
    const [numberField, selectField] = fields;
    expect(numberField.riskRules[0].expected).toBe("4");
    expect(numberField.riskRules[1].expected).toBe("1, 2");
    expect(numberField.riskRules[2]).toMatchObject({ valueFrom: "1", valueTo: "9" });
    expect(selectField.placeholder).toBe("Elegí");
    expect(selectField.riskRules[0].expected).toBe(selectField.options[0].uid);
    expect(selectField.riskRules[1].active).toBe(false);
    expect(selectField.riskRules[1].expectedList[1]).toBe("missing:MISSING");
  });

  it("tolera respuestas vacías o campos incompletos", () => {
    expect(fieldsFromApi(null)).toEqual([]);
    expect(fieldsFromApi({})).toEqual([]);
    const field = fieldFromApi({ type: "BOOLEAN" });
    expect(field).toMatchObject({ code: "", label: "", required: false, allowUnknown: false, placeholder: "", options: [] });
    const sparse = fieldFromApi({
      type: "SELECT",
      config: { options: [{}, { label: "x", value: "y" }] },
      riskRules: [{ operator: "GREATER_THAN" }],
    });
    expect(sparse.options[0]).toMatchObject({ label: "", value: "" });
    expect(sparse.riskRules[0]).toMatchObject({ riskIncrement: "0", valueFrom: "", valueTo: "" });
    expect(fieldsFromApi({ fields: [{ type: "TEXT" }, { type: "TEXT", displayOrder: 1 }] })).toHaveLength(2);
  });
});

describe("ruleToApi / fieldsToApi", () => {
  it("serializa cada operador según el tipo de campo", () => {
    const boolField = { ...emptyField("BOOLEAN") };
    expect(ruleToApi(rule("BOOLEAN", { expected: "true", riskIncrement: "10" }), boolField)).toEqual({
      operator: "EQUALS",
      riskIncrement: 10,
      active: true,
      expectedValue: true,
    });
    expect(ruleToApi(rule("BOOLEAN", { expected: "false" }), boolField).expectedValue).toBe(false);

    const numberField = emptyField("NUMBER");
    expect(ruleToApi(rule("NUMBER", { expected: "2,5" }), numberField).expectedValue).toBe(2.5);
    expect(ruleToApi(rule("NUMBER", { operator: "IN", expected: "1, 2,x" }), numberField).expectedValue).toEqual([1, 2, NaN]);
    expect(ruleToApi(rule("NUMBER", { operator: "BETWEEN", valueFrom: "1", valueTo: "3" }), numberField)).toMatchObject({
      valueFrom: 1,
      valueTo: 3,
    });
    const greater = ruleToApi(rule("NUMBER", { operator: "GREATER_THAN", valueFrom: "5" }), numberField);
    expect(greater.valueFrom).toBe(5);
    expect(greater).not.toHaveProperty("valueTo");
    const less = ruleToApi(rule("NUMBER", { operator: "LESS_THAN", valueTo: "5" }), numberField);
    expect(less.valueTo).toBe(5);
    expect(ruleToApi(rule("NUMBER", { operator: "OTHER" }), numberField)).toEqual({
      operator: "OTHER",
      riskIncrement: 10,
      active: true,
    });

    const selectField = select();
    expect(ruleToApi(rule("SELECT", { expected: "o2" }), selectField).expectedValue).toBe("DOS");
    expect(ruleToApi(rule("SELECT", { operator: "IN", expectedList: ["o1", "o3"] }), selectField).expectedValue).toEqual([
      "UNO",
      "TRES",
    ]);
    expect(ruleToApi(rule("SELECT", { riskIncrement: "" }), selectField).riskIncrement).toBeNaN();
  });

  it("arma el payload completo con orden, config y reglas por tipo", () => {
    const text = { ...emptyField("TEXT"), code: " nombre ", label: " Nombre ", placeholder: " Tu nombre " };
    const date = { ...emptyField("DATE"), code: "fecha", label: "Fecha", placeholder: "ignorado", allowUnknown: true };
    const sel = select({
      placeholder: "",
      riskRules: [rule("SELECT", { expected: "o1" })],
    });
    const payload = fieldsToApi([text, date, sel]);

    expect(payload.fields.map((field) => field.displayOrder)).toEqual([1, 2, 3]);
    expect(payload.fields[0]).toMatchObject({ code: "nombre", label: "Nombre", config: { placeholder: "Tu nombre" }, riskRules: [] });
    expect(payload.fields[1].config).toEqual({});
    expect(payload.fields[1].allowUnknown).toBe(true);
    expect(payload.fields[2].config).toEqual({
      options: [
        { label: "Uno", value: "UNO" },
        { label: "Dos", value: "DOS" },
        { label: "Tres", value: "TRES" },
      ],
    });
    expect(payload.fields[2].riskRules).toHaveLength(1);
    const noRisk = fieldsToApi([{ ...text, riskRules: [rule("TEXT")] }]);
    expect(noRisk.fields[0].riskRules).toEqual([]);
  });

  it("hace un round-trip API -> editor -> API", () => {
    const original = {
      fields: [
        {
          code: "riesgo",
          label: "¿Hay riesgo?",
          type: "BOOLEAN",
          required: true,
          allowUnknown: true,
          displayOrder: 1,
          config: {},
          riskRules: [{ operator: "EQUALS", expectedValue: true, riskIncrement: 20, active: true }],
        },
        {
          code: "cantidad",
          label: "Cantidad",
          type: "NUMBER",
          required: false,
          allowUnknown: false,
          displayOrder: 2,
          config: { placeholder: "0" },
          riskRules: [{ operator: "BETWEEN", valueFrom: 1, valueTo: 5, riskIncrement: 7, active: false }],
        },
      ],
    };
    expect(fieldsToApi(fieldsFromApi(original))).toEqual(original);
  });
});

describe("validateFields", () => {
  it("exige al menos una pregunta", () => {
    const result = validateFields([]);
    expect(result.form).toEqual(["El formulario debe tener al menos una pregunta."]);
    expect(result.count).toBe(1);
  });

  it("acepta un formulario válido", () => {
    const result = validateFields([{ ...emptyField("TEXT"), code: "nombre", label: "Nombre" }]);
    expect(result).toEqual({ form: [], byField: {}, count: 0 });
  });

  it("valida etiqueta y código", () => {
    const base = { ...emptyField("TEXT") };
    const cases = [
      [{ ...base, code: "a", label: "" }, "label"],
      [{ ...base, code: "a", label: "x".repeat(201) }, "label"],
      [{ ...base, code: "", label: "x" }, "code"],
      [{ ...base, code: "a".repeat(101), label: "x" }, "code"],
      [{ ...base, code: "1abc", label: "x" }, "code"],
      [{ ...base, code: "con espacio", label: "x" }, "code"],
    ];
    cases.forEach(([field, key]) => {
      expect(validateFields([field]).byField[field.uid][key]).toBeTruthy();
    });
  });

  it("detecta códigos repetidos sin distinguir mayúsculas", () => {
    const a = { ...emptyField("TEXT"), code: "Nombre", label: "A" };
    const b = { ...emptyField("TEXT"), code: "nombre", label: "B" };
    const result = validateFields([a, b]);
    expect(result.byField[a.uid].code).toMatch(/repetido/);
    expect(result.byField[b.uid].code).toMatch(/repetido/);
    expect(result.count).toBe(2);
  });

  it("valida las opciones de una lista", () => {
    const empty = select({ options: [] });
    expect(validateFields([empty]).byField[empty.uid].options).toMatch(/al menos una opción/);
    const blank = select({ options: [{ uid: "1", label: "", value: "" }] });
    expect(validateFields([blank]).byField[blank.uid].options).toMatch(/texto y valor/);
    const dup = select({
      options: [
        { uid: "1", label: "A", value: "X" },
        { uid: "2", label: "B", value: "X" },
      ],
    });
    expect(validateFields([dup]).byField[dup.uid].options).toMatch(/repetidos/);
    expect(validateFields([select()]).count).toBe(0);
  });

  it("valida los puntos de riesgo", () => {
    const field = { ...emptyField("BOOLEAN"), code: "b", label: "B" };
    const messageFor = (riskIncrement) => {
      const withRule = { ...field, riskRules: [rule("BOOLEAN", { riskIncrement })] };
      return Object.values(validateFields([withRule]).byField[withRule.uid]?.rules ?? {})[0];
    };
    expect(messageFor("abc")).toMatch(/número entero/);
    expect(messageFor("1.5")).toMatch(/número entero/);
    expect(messageFor("101")).toMatch(/entre -100 y 100/);
    expect(messageFor("-101")).toMatch(/entre -100 y 100/);
    expect(messageFor("-100")).toBeUndefined();
    expect(messageFor("100")).toBeUndefined();
  });

  it("valida las reglas de número", () => {
    const build = (ruleOverrides) => {
      const field = { ...emptyField("NUMBER"), code: "n", label: "N", riskRules: [rule("NUMBER", ruleOverrides)] };
      return Object.values(validateFields([field]).byField[field.uid]?.rules ?? {})[0];
    };
    expect(build({ operator: "EQUALS", expected: "" })).toMatch(/número a comparar/);
    expect(build({ operator: "EQUALS", expected: "3" })).toBeUndefined();
    expect(build({ operator: "IN", expected: "" })).toMatch(/separados por coma/);
    expect(build({ operator: "IN", expected: "1, x" })).toMatch(/separados por coma/);
    expect(build({ operator: "IN", expected: "1, 2" })).toBeUndefined();
    expect(build({ operator: "BETWEEN", valueFrom: "", valueTo: "2" })).toMatch(/desde y el hasta/);
    expect(build({ operator: "BETWEEN", valueFrom: "5", valueTo: "2" })).toMatch(/no puede ser mayor/);
    expect(build({ operator: "BETWEEN", valueFrom: "1", valueTo: "2" })).toBeUndefined();
    expect(build({ operator: "GREATER_THAN", valueFrom: "" })).toMatch(/número mínimo/);
    expect(build({ operator: "GREATER_THAN", valueFrom: "1" })).toBeUndefined();
    expect(build({ operator: "LESS_THAN", valueTo: "" })).toMatch(/número máximo/);
    expect(build({ operator: "LESS_THAN", valueTo: "1" })).toBeUndefined();
    expect(build({ operator: "NOPE" })).toMatch(/Operador inválido/);
  });

  it("valida las reglas de lista", () => {
    const build = (ruleOverrides) => {
      const field = select({ riskRules: [rule("SELECT", ruleOverrides)] });
      return Object.values(validateFields([field]).byField[field.uid]?.rules ?? {})[0];
    };
    expect(build({ operator: "EQUALS", expected: "" })).toMatch(/opción que exista/);
    expect(build({ operator: "EQUALS", expected: "o1" })).toBeUndefined();
    expect(build({ operator: "IN", expectedList: [] })).toMatch(/al menos una opción/);
    expect(build({ operator: "IN", expectedList: ["o1", "gone"] })).toMatch(/ya no existe/);
    expect(build({ operator: "IN", expectedList: ["o1", "o2"] })).toBeUndefined();
  });

  it("detecta reglas superpuestas entre valores discretos", () => {
    const field = select({
      riskRules: [
        rule("SELECT", { operator: "EQUALS", expected: "o1" }),
        rule("SELECT", { operator: "IN", expectedList: ["o1", "o2"] }),
        rule("SELECT", { operator: "EQUALS", expected: "o3" }),
      ],
    });
    const rules = validateFields([field]).byField[field.uid].rules;
    expect(rules[field.riskRules[1].uid]).toMatch(/superpone/);
    expect(rules[field.riskRules[2].uid]).toBeUndefined();
  });

  it("ignora reglas inactivas o inválidas al buscar superposiciones", () => {
    const inactive = select({
      riskRules: [
        rule("SELECT", { expected: "o1" }),
        rule("SELECT", { expected: "o1", active: false }),
      ],
    });
    expect(validateFields([inactive]).count).toBe(0);
    const invalid = { ...emptyField("NUMBER"), code: "n", label: "N", riskRules: [rule("NUMBER", { expected: "1" }), rule("NUMBER", { expected: "" })] };
    const result = validateFields([invalid]);
    expect(Object.keys(result.byField[invalid.uid].rules)).toHaveLength(1);
  });

  it("detecta superposición entre números discretos y rangos", () => {
    const overlapping = (a, b) => {
      const field = { ...emptyField("NUMBER"), code: "n", label: "N", riskRules: [rule("NUMBER", a), rule("NUMBER", b)] };
      return Boolean(validateFields([field]).byField[field.uid]);
    };
    expect(overlapping({ operator: "EQUALS", expected: "5" }, { operator: "BETWEEN", valueFrom: "1", valueTo: "10" })).toBe(true);
    expect(overlapping({ operator: "BETWEEN", valueFrom: "1", valueTo: "10" }, { operator: "EQUALS", expected: "5" })).toBe(true);
    expect(overlapping({ operator: "EQUALS", expected: "50" }, { operator: "BETWEEN", valueFrom: "1", valueTo: "10" })).toBe(false);
    expect(overlapping({ operator: "IN", expected: "1, 2" }, { operator: "GREATER_THAN", valueFrom: "2" })).toBe(true);
    expect(overlapping({ operator: "IN", expected: "1, 2" }, { operator: "GREATER_THAN", valueFrom: "3" })).toBe(false);
    expect(overlapping({ operator: "EQUALS", expected: "5" }, { operator: "LESS_THAN", valueTo: "4" })).toBe(false);
    expect(overlapping({ operator: "EQUALS", expected: "5" }, { operator: "EQUALS", expected: "5" })).toBe(true);
    expect(overlapping({ operator: "EQUALS", expected: "5" }, { operator: "EQUALS", expected: "6" })).toBe(false);
    expect(overlapping({ operator: "IN", expected: "1, 2" }, { operator: "IN", expected: "2, 3" })).toBe(true);
  });

  it("detecta superposición entre rangos", () => {
    const overlapping = (a, b) => {
      const field = { ...emptyField("NUMBER"), code: "n", label: "N", riskRules: [rule("NUMBER", a), rule("NUMBER", b)] };
      return Boolean(validateFields([field]).byField[field.uid]);
    };
    expect(overlapping({ operator: "BETWEEN", valueFrom: "1", valueTo: "5" }, { operator: "BETWEEN", valueFrom: "5", valueTo: "9" })).toBe(true);
    expect(overlapping({ operator: "BETWEEN", valueFrom: "1", valueTo: "4" }, { operator: "BETWEEN", valueFrom: "5", valueTo: "9" })).toBe(false);
    expect(overlapping({ operator: "GREATER_THAN", valueFrom: "3" }, { operator: "LESS_THAN", valueTo: "10" })).toBe(true);
    expect(overlapping({ operator: "GREATER_THAN", valueFrom: "10" }, { operator: "LESS_THAN", valueTo: "3" })).toBe(false);
  });

  it("no considera superpuestos los valores nulos en SELECT/BOOLEAN", () => {
    const field = { ...emptyField("BOOLEAN"), code: "b", label: "B", riskRules: [rule("BOOLEAN", { expected: "true" }), rule("BOOLEAN", { expected: "false" })] };
    expect(validateFields([field]).count).toBe(0);
  });
});

describe("snapshot", () => {
  it("cambia cuando cambia el formulario y es estable si no", () => {
    const field = { ...emptyField("TEXT"), code: "a", label: "A" };
    expect(snapshot([field])).toBe(snapshot([{ ...field }]));
    expect(snapshot([field])).not.toBe(snapshot([{ ...field, label: "B" }]));
  });

  it("serializa NaN como null", () => {
    const sel = select({ riskRules: [rule("SELECT", { riskIncrement: "" })] });
    expect(snapshot([sel])).toContain('"riskIncrement":null');
  });
});
