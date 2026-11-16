import { expect } from "@playwright/test";

/**
 * Mockea la API de M2 (todo lo que cuelga de /api) y bloquea los recursos
 * externos (Google Tag, fuentes, mapas) para que la prueba sea determinista.
 *
 * `routes` es una lista de [método, ruta, respuesta]:
 *  - la ruta es el path sin /api (string exacto o RegExp);
 *  - la respuesta es un objeto { status?, body? } o una función (request) => objeto.
 * Un pedido sin mock responde 501 y se registra: `expectNoUnmockedRequests`
 * hace fallar la prueba, así un endpoint nuevo no pasa inadvertido.
 */
export async function mockApi(page, routes) {
  const calls = [];
  const unmocked = [];

  const isLocal = (url) => url.hostname === "localhost";
  await page.route((url) => !isLocal(url), (route) => route.abort());

  await page.route((url) => isLocal(url) && url.pathname.startsWith("/api/"), async (route) => {
    const request = route.request();
    const { pathname, search } = new URL(request.url());
    const path = pathname.replace(/^\/api/, "");
    const found = routes.find(
      ([method, pattern]) =>
        method === request.method() && (pattern instanceof RegExp ? pattern.test(path) : pattern === path),
    );
    if (!found) {
      unmocked.push(`${request.method()} ${path}${search}`);
      return route.fulfill({ status: 501, json: { message: "E2E: endpoint sin mock" } });
    }
    calls.push({ method: request.method(), path, search, body: request.postData() });
    const reply = typeof found[2] === "function" ? found[2](request) : found[2];
    return route.fulfill({ status: reply.status ?? 200, json: reply.body ?? null });
  });

  return {
    calls,
    callsTo: (method, path) => calls.filter((call) => call.method === method && call.path === path),
    expectNoUnmockedRequests: () => expect(unmocked, "pedidos a la API sin mock").toEqual([]),
  };
}
