import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MOCK_CATEGORIES, NEIGHBORHOODS } from "../mockCategories";

describe("catalog factories", () => {
  it("preserves all 140 request types and the complete original catalog", () => {
    // Digest of JSON.stringify before replacing repeated objects with factories.
    expect(createHash("sha256").update(JSON.stringify(MOCK_CATEGORIES)).digest("hex"))
      .toBe("e8d4486c0bce3faef67f046b497c110436a377745223beada1641c432bbfc5c4");
    expect(MOCK_CATEGORIES).toHaveLength(15);
    expect(MOCK_CATEGORIES.flatMap(c => c.subcategories).flatMap(s => s.requestTypes)).toHaveLength(140);
    expect(NEIGHBORHOODS).toHaveLength(48);
  });

  it("creates independent field objects for each request type", () => {
    const [first, second] = MOCK_CATEGORIES[0].subcategories[0].requestTypes;
    expect(first.specificFields).not.toBe(second.specificFields);
    expect(first.specificFields[0]).not.toBe(second.specificFields[0]);
  });
});
