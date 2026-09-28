import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// These are the twelve modules covered by the original three focused suites.
// Everything else must remain loadable.  Using a glob means a newly added source
// file automatically joins this contract instead of disappearing from coverage.
const previouslyCovered = new Set([
  "/src/constants/cancellationReasons.js",
  "/src/constants/resolutionTypes.js",
  "/src/constants/responsibleAreas.js",
  "/src/constants/slaStatuses.js",
  "/src/constants/ticketActivities.js",
  "/src/constants/ticketStatuses.js",
  "/src/hooks/useAgentTickets.js",
  "/src/hooks/useAllAgentTickets.js",
  "/src/utils/catalogErrors.js",
  "/src/utils/duplicateLink.js",
  "/src/utils/ticketIndicators.js",
  "/src/utils/ticketLocation.js",
]);

const productionModules = import.meta.glob("/src/**/*.{js,jsx}");
const remainingModules = Object.entries(productionModules)
  .filter(([path]) => !path.includes("/__tests__/") && !path.includes("/test/") && !path.includes(".test.") && !previouslyCovered.has(path))
  .sort(([left], [right]) => left.localeCompare(right));

describe("inventario completo de módulos productivos", () => {
  beforeAll(() => {
    document.body.innerHTML = '<div id="root"></div>';
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "Unauthorized" }),
    }));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("incluye exactamente los 88 archivos que antes faltaban", () => {
    expect(remainingModules).toHaveLength(88);
  });

  it.each(remainingModules)("%s se puede cargar", async (_path, loadModule) => {
    const loaded = await loadModule();
    expect(loaded).toBeTypeOf("object");
  });
});