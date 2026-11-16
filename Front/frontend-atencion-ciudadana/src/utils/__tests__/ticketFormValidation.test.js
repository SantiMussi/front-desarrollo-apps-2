import { describe, expect, it } from "vitest";
import { creationLocation, specificAnswers, UNKNOWN_VALUE } from "../ticketFormValidation";
import { attachmentError, ATTACHMENT_TYPES, MAX_FILE_BYTES } from "../attachments";

const empty = { address: "", streetNumber: "", neighborhoodId: "", latitude: null, longitude: null };
const uuid = "11111111-1111-4111-8111-111111111111";
describe("H18 location alternatives match TicketService", () => {
  it("omits optional location and rejects missing required location", () => {
    expect(creationLocation(empty, false)).toEqual({ location: null });
    expect(creationLocation(empty, true).error).toMatch(/Indicá/);
    expect(creationLocation({ ...empty, streetNumber: "123" }, true).error).toMatch(/Indicá/);
  });
  it.each([{ address: " Corrientes ", streetNumber: " 10 " }, { neighborhoodId: uuid }, { latitude: 0, longitude: 0 }, { latitude: -90, longitude: 180 }, { latitude: 90, longitude: -180 }])("accepts a sufficient representation %j", (data) => {
    const result = creationLocation({ ...empty, ...data }, true);
    expect(result.error).toBeUndefined();
    expect(result.location).toBeTruthy();
  });
  it.each([{ latitude: 0 }, { longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: Infinity, longitude: 0 }, { latitude: "oops", longitude: 0 }, { latitude: " ", longitude: 0 }, { latitude: false, longitude: 0 }, { neighborhoodId: "invented" }])("rejects invalid supplied location even if optional %j", (data) => {
    expect(creationLocation({ ...empty, ...data }, false).error).toBeTruthy();
  });
  it("keeps zero coordinates and does not derive a neighborhood", () => {
    expect(creationLocation({ ...empty, latitude: "0", longitude: "0" }, true).location).toMatchObject({ latitude: 0, longitude: 0, neighborhoodId: null, addressLine: "" });
  });
});

const field = (overrides = {}) => ({ key: "answer", code: "ANSWER", label: "Respuesta", backendType: "TEXT", required: true, options: [{ value: "valid" }], ...overrides });
describe("H18 JSON answers", () => {
  it.each([["BOOLEAN", false, false], ["BOOLEAN", "false", false], ["BOOLEAN", true, true], ["NUMBER", 0, 0], ["NUMBER", "0", 0], ["TEXT", "hola", "hola"], ["TEXTAREA", "texto\nlargo", "texto\nlargo"], ["DATE", "2024-02-29", "2024-02-29"], ["SELECT", "valid", "valid"]])("preserves %s %j", (backendType, raw, expected) => {
    expect(specificAnswers([field({ backendType })], { answer: raw })).toEqual({ data: { ANSWER: expected }, errors: {} });
  });
  it.each([undefined, ""])("distinguishes omitted/empty %j from a response", (answer) => {
    expect(specificAnswers([field()], { answer }).errors).toHaveProperty("specific_answer");
    expect(specificAnswers([field({ required: false })], { answer })).toEqual({ data: {}, errors: {} });
  });
  it.each([null, UNKNOWN_VALUE])("only allows explicit unknown %j when configured", (answer) => {
    expect(specificAnswers([field({ allowUnknown: true })], { answer })).toEqual({ data: { ANSWER: null }, errors: {} });
    expect(specificAnswers([field()], { answer }).errors).toHaveProperty("specific_answer");
  });
  it.each([["NUMBER", Infinity], ["NUMBER", " "], ["NUMBER", "not a number"], ["BOOLEAN", "maybe"], ["SELECT", "other"], ["DATE", "2025-02-29"], ["DATE", "yesterday"], ["DATE", "2026-1-1"]])("rejects invalid %s %j", (backendType, answer) => {
    expect(specificAnswers([field({ backendType })], { answer }).errors).toHaveProperty("specific_answer");
  });
  it("applies numeric bounds, excludes foreign keys and sends null for allowed unknown", () => {
    const fields = [field({ backendType: "NUMBER", config: { min: 0, max: 10 } })];
    for (const answer of [-1, 11]) expect(specificAnswers(fields, { answer }).errors).toHaveProperty("specific_answer");
    expect(specificAnswers(fields, { answer: 0, foreign: 42 }).data).toEqual({ ANSWER: 0 });
    expect(specificAnswers([field({ allowUnknown: true })], {}).errors.specific_answer).toMatch(/No sé/);
  });
});

describe("H31 metadata limits", () => {
  const file = (type = "image/png", size = 1) => ({ type, size });
  it.each(ATTACHMENT_TYPES)("allows %s at exactly 10 MiB", (type) => {
    expect(attachmentError([file(type, MAX_FILE_BYTES)])).toBeNull();
  });
  it("accepts exactly 5 files/50 MiB, including creation wrappers", () => {
    expect(attachmentError(Array.from({ length: 5 }, () => ({ file: file("application/pdf", MAX_FILE_BYTES) })))).toBeNull();
  });
  it.each(["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/gif", ""])("rejects unsupported %s", (type) => expect(attachmentError([file(type)])).toMatch(/Formato/));
  it("rejects empty, oversized files and a sixth file", () => {
    expect(attachmentError([file("image/png", 0)])).toMatch(/vacíos/);
    expect(attachmentError([file("image/png", MAX_FILE_BYTES + 1)])).toMatch(/10 MiB/);
    expect(attachmentError(Array.from({ length: 6 }, () => file()))).toMatch(/cinco/);
  });
});
