// Modelo del constructor visual de schemas de formularios dinámicos.
//
// Contrato real del back (PUT /admin/catalog/request-types/{id}/form):
//   { fields: [{ code, label, type, required, allowUnknown, displayOrder,
//                config, riskRules: [{ operator, expectedValue, valueFrom,
//                valueTo, riskIncrement, active }] }] }
// - type: TEXT | TEXTAREA | SELECT | BOOLEAN | NUMBER | DATE
// - config depende del tipo: { placeholder } en TEXT/TEXTAREA/NUMBER,
//   { options: [{ label, value }], placeholder } en SELECT, {} en el resto.
// - riskRules sólo en BOOLEAN | SELECT | NUMBER.
// Cada guardado crea una versión nueva; los tickets viejos conservan la suya.

export const FIELD_TYPES = [
  { value: "TEXT", label: "Texto corto", description: "Una línea de texto libre.", placeholder: true, risk: false },
  { value: "TEXTAREA", label: "Texto largo", description: "Varias líneas de texto libre.", placeholder: true, risk: false },
  { value: "SELECT", label: "Lista de opciones", description: "El vecino elige una opción de una lista.", placeholder: true, risk: true },
  { value: "BOOLEAN", label: "Sí / No", description: "Pregunta de respuesta afirmativa o negativa.", placeholder: false, risk: true },
  { value: "NUMBER", label: "Número", description: "Un valor numérico.", placeholder: true, risk: true },
  { value: "DATE", label: "Fecha", description: "Una fecha (yyyy-MM-dd).", placeholder: false, risk: false },
];

export const FIELD_TYPE_BY_VALUE = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t]));

export const OPERATOR_LABELS = {
  EQUALS: "es igual a",
  IN: "es alguno de",
  BETWEEN: "está entre",
  GREATER_THAN: "es mayor que",
  LESS_THAN: "es menor que",
};

export const OPERATORS_BY_TYPE = {
  BOOLEAN: ["EQUALS"],
  SELECT: ["EQUALS", "IN"],
  NUMBER: ["EQUALS", "IN", "BETWEEN", "GREATER_THAN", "LESS_THAN"],
};

export const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
export const MAX_CODE = 100;
export const MAX_LABEL = 200;
export const MIN_INCREMENT = -100;
export const MAX_INCREMENT = 100;

let sequence = 0;
export const newUid = () => `u${++sequence}`;

const stripAccents = (text) => String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");

export function slugifyCode(label) {
  const words = stripAccents(label)
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  let code = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
  if (!/^[A-Za-z]/.test(code)) code = `campo${code.charAt(0).toUpperCase()}${code.slice(1)}`;
  return code.slice(0, MAX_CODE);
}

export function slugifyOptionValue(label) {
  return stripAccents(label)
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 100);
}

export const emptyOption = () => ({ uid: newUid(), label: "", value: "", valueTouched: false });

export function emptyRule(type) {
  return {
    uid: newUid(),
    active: true,
    operator: "EQUALS",
    riskIncrement: "10",
    expected: type === "BOOLEAN" ? "true" : "",
    expectedList: [],
    valueFrom: "",
    valueTo: "",
  };
}

export function emptyField(type = "TEXT") {
  return {
    uid: newUid(),
    code: "",
    codeTouched: false,
    label: "",
    type,
    required: true,
    allowUnknown: false,
    placeholder: "",
    options: type === "SELECT" ? [emptyOption(), emptyOption()] : [],
    riskRules: [],
  };
}

// ---------- API -> estado del editor ----------

function ruleFromApi(rule, type, options) {
  const optionUid = (value) => options.find((o) => o.value === value)?.uid ?? `missing:${value}`;
  const base = {
    uid: newUid(),
    active: rule.active !== false,
    operator: rule.operator,
    riskIncrement: String(rule.riskIncrement ?? 0),
    expected: "",
    expectedList: [],
    valueFrom: rule.valueFrom == null ? "" : String(rule.valueFrom),
    valueTo: rule.valueTo == null ? "" : String(rule.valueTo),
  };
  const expected = rule.expectedValue;
  if (rule.operator === "EQUALS" && expected != null) {
    base.expected = type === "SELECT" ? optionUid(expected) : String(expected);
  } else if (rule.operator === "IN" && Array.isArray(expected)) {
    if (type === "SELECT") base.expectedList = expected.map(optionUid);
    else base.expected = expected.join(", ");
  }
  return base;
}

export function fieldFromApi(field) {
  const type = field.type;
  const config = field.config ?? {};
  const options = (Array.isArray(config.options) ? config.options : []).map((option) => ({
    uid: newUid(),
    label: String(option.label ?? ""),
    value: String(option.value ?? ""),
    valueTouched: true,
  }));
  return {
    uid: newUid(),
    code: field.code ?? "",
    codeTouched: true,
    label: field.label ?? "",
    type,
    required: Boolean(field.required),
    allowUnknown: Boolean(field.allowUnknown),
    placeholder: typeof config.placeholder === "string" ? config.placeholder : "",
    options,
    riskRules: (field.riskRules ?? []).map((rule) => ruleFromApi(rule, type, options)),
  };
}

export function fieldsFromApi(response) {
  const fields = [...(response?.fields ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  return fields.map(fieldFromApi);
}

// ---------- estado del editor -> API ----------

const toNumber = (text) => (String(text ?? "").trim() === "" ? NaN : Number(String(text).replace(",", ".")));
const parseNumberList = (text) =>
  String(text ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part.replace(",", ".")));

export function ruleToApi(rule, field) {
  const optionValue = (uid) => field.options.find((o) => o.uid === uid)?.value;
  const payload = {
    operator: rule.operator,
    riskIncrement: toNumber(rule.riskIncrement),
    active: rule.active,
  };
  switch (rule.operator) {
    case "EQUALS":
      if (field.type === "BOOLEAN") payload.expectedValue = rule.expected === "true";
      else if (field.type === "NUMBER") payload.expectedValue = toNumber(rule.expected);
      else payload.expectedValue = optionValue(rule.expected);
      break;
    case "IN":
      payload.expectedValue =
        field.type === "SELECT" ? rule.expectedList.map(optionValue) : parseNumberList(rule.expected);
      break;
    case "BETWEEN":
      payload.valueFrom = toNumber(rule.valueFrom);
      payload.valueTo = toNumber(rule.valueTo);
      break;
    case "GREATER_THAN":
      payload.valueFrom = toNumber(rule.valueFrom);
      break;
    case "LESS_THAN":
      payload.valueTo = toNumber(rule.valueTo);
      break;
    default:
      break;
  }
  return payload;
}

function configToApi(field) {
  const meta = FIELD_TYPE_BY_VALUE[field.type];
  const config = {};
  if (field.type === "SELECT") {
    config.options = field.options.map((o) => ({ label: o.label.trim(), value: o.value.trim() }));
  }
  if (meta?.placeholder && field.placeholder.trim()) config.placeholder = field.placeholder.trim();
  return config;
}

export function fieldsToApi(fields) {
  return {
    fields: fields.map((field, index) => ({
      code: field.code.trim(),
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      allowUnknown: field.allowUnknown,
      displayOrder: index + 1,
      config: configToApi(field),
      riskRules: FIELD_TYPE_BY_VALUE[field.type]?.risk ? field.riskRules.map((rule) => ruleToApi(rule, field)) : [],
    })),
  };
}

// ---------- validación (espejo de FormAdminService) ----------

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

function sameValue(type, a, b) {
  if (a == null || b == null) return false;
  return type === "NUMBER" ? Number(a) === Number(b) : a === b;
}

function discreteValues(rule) {
  if (rule.operator === "IN") return Array.isArray(rule.expectedValue) ? rule.expectedValue : [];
  return rule.expectedValue == null ? [] : [rule.expectedValue];
}

const isDiscrete = (rule) => rule.operator === "EQUALS" || rule.operator === "IN";

function lowerBound(rule) {
  return rule.operator === "BETWEEN" || rule.operator === "GREATER_THAN" ? rule.valueFrom : -Infinity;
}

function upperBound(rule) {
  return rule.operator === "BETWEEN" || rule.operator === "LESS_THAN" ? rule.valueTo : Infinity;
}

function rulesOverlap(type, a, b) {
  const discreteA = isDiscrete(a);
  const discreteB = isDiscrete(b);
  if (discreteA && discreteB) {
    return discreteValues(a).some((x) => discreteValues(b).some((y) => sameValue(type, x, y)));
  }
  if (discreteA || discreteB) {
    const discrete = discreteA ? a : b;
    const range = discreteA ? b : a;
    return discreteValues(discrete).some(
      (value) => isNumber(value) && value >= lowerBound(range) && value <= upperBound(range)
    );
  }
  return Math.max(lowerBound(a), lowerBound(b)) <= Math.min(upperBound(a), upperBound(b));
}

function validateRule(rule, field, apiRule) {
  const increment = apiRule.riskIncrement;
  if (!isNumber(increment) || !Number.isInteger(increment)) return "Los puntos de riesgo deben ser un número entero.";
  if (increment < MIN_INCREMENT || increment > MAX_INCREMENT) {
    return `Los puntos de riesgo deben estar entre ${MIN_INCREMENT} y ${MAX_INCREMENT}.`;
  }
  switch (rule.operator) {
    case "EQUALS":
      if (field.type === "BOOLEAN") return null;
      if (field.type === "NUMBER") return isNumber(apiRule.expectedValue) ? null : "Ingresá el número a comparar.";
      return apiRule.expectedValue ? null : "Elegí una opción que exista en la lista.";
    case "IN":
      if (field.type === "SELECT") {
        if (!rule.expectedList.length) return "Elegí al menos una opción.";
        return apiRule.expectedValue.every(Boolean) ? null : "La regla usa una opción que ya no existe en la lista.";
      }
      if (!apiRule.expectedValue.length || !apiRule.expectedValue.every(isNumber)) {
        return "Ingresá números separados por coma (ej.: 1, 2, 3).";
      }
      return null;
    case "BETWEEN":
      if (!isNumber(apiRule.valueFrom) || !isNumber(apiRule.valueTo)) return "Completá el desde y el hasta con números.";
      return apiRule.valueFrom <= apiRule.valueTo ? null : "El desde no puede ser mayor que el hasta.";
    case "GREATER_THAN":
      return isNumber(apiRule.valueFrom) ? null : "Ingresá el número mínimo.";
    case "LESS_THAN":
      return isNumber(apiRule.valueTo) ? null : "Ingresá el número máximo.";
    default:
      return "Operador inválido.";
  }
}

// Devuelve { form: string[], byField: { [uid]: { label, code, options, general, rules: { [ruleUid]: msg } } }, count }
export function validateFields(fields) {
  const form = [];
  const byField = {};
  if (!fields.length) form.push("El formulario debe tener al menos una pregunta.");

  const seenCodes = new Map();
  fields.forEach((field) => {
    const code = field.code.trim().toLowerCase();
    if (code) seenCodes.set(code, (seenCodes.get(code) ?? 0) + 1);
  });

  fields.forEach((field) => {
    const errors = { rules: {} };
    if (!field.label.trim()) errors.label = "Escribí la pregunta que va a ver el vecino.";
    else if (field.label.trim().length > MAX_LABEL) errors.label = `Máximo ${MAX_LABEL} caracteres.`;

    const code = field.code.trim();
    if (!code) errors.code = "El código es obligatorio.";
    else if (code.length > MAX_CODE) errors.code = `Máximo ${MAX_CODE} caracteres.`;
    else if (!CODE_PATTERN.test(code)) errors.code = "Usá letras, números o _ y empezá con una letra (sin espacios).";
    else if (seenCodes.get(code.toLowerCase()) > 1) errors.code = "Este código está repetido en el formulario.";

    if (field.type === "SELECT") {
      if (!field.options.length) {
        errors.options = "Agregá al menos una opción.";
      } else {
        const values = new Map();
        field.options.forEach((option) => {
          const value = option.value.trim();
          if (value) values.set(value, (values.get(value) ?? 0) + 1);
        });
        const problem = field.options.find((option) => !option.label.trim() || !option.value.trim());
        if (problem) errors.options = "Todas las opciones necesitan texto y valor.";
        else if ([...values.values()].some((count) => count > 1)) errors.options = "Hay valores de opción repetidos.";
      }
    }

    if (FIELD_TYPE_BY_VALUE[field.type]?.risk) {
      const apiRules = field.riskRules.map((rule) => ruleToApi(rule, field));
      field.riskRules.forEach((rule, index) => {
        const message = validateRule(rule, field, apiRules[index]);
        if (message) errors.rules[rule.uid] = message;
      });
      for (let i = 0; i < field.riskRules.length; i += 1) {
        for (let j = i + 1; j < field.riskRules.length; j += 1) {
          const a = field.riskRules[i];
          const b = field.riskRules[j];
          if (!a.active || !b.active || errors.rules[a.uid] || errors.rules[b.uid]) continue;
          if (rulesOverlap(field.type, apiRules[i], apiRules[j])) {
            errors.rules[b.uid] = "Se superpone con otra regla activa: podrían coincidir con la misma respuesta.";
          }
        }
      }
    }

    if (errors.label || errors.code || errors.options || Object.keys(errors.rules).length) byField[field.uid] = errors;
  });

  const count = form.length + Object.keys(byField).length;
  return { form, byField, count };
}

// Firma estable para detectar cambios sin guardar.
export function snapshot(fields) {
  return JSON.stringify(fieldsToApi(fields), (key, value) => (typeof value === "number" && Number.isNaN(value) ? null : value));
}
