import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const backend = resolve(app, process.env.M2_E2E_BACKEND_DIR || "../../../Backend-DAMII");
const project = `m2-e2e-${randomUUID()}`;
const composeArgs = ["compose", "--project-name", project, "--file", "e2e/compose.yml"];
const env = {
  ...process.env,
  M2_E2E_BACKEND_DIR: backend,
  M2_E2E_DB_PASSWORD: randomBytes(24).toString("hex"),
  M2_E2E_FIXTURE_PASSWORD: randomBytes(24).toString("hex"),
  M2_E2E_TRACKING_KEY: randomBytes(32).toString("base64"),
};

function compose(args, stdio = "inherit") {
  return execFileSync("docker", [...composeArgs, ...args], { cwd: app, env, stdio, encoding: "utf8" });
}

if (!existsSync(join(app, "dist/index.html"))) {
  throw new Error("Falta dist/index.html. Compilá el Frontend con VITE_IDENTITY_PROVIDER=MOCK y VITE_API_BASE_URL=/api.");
}
if (!existsSync(join(backend, "Dockerfile"))) {
  throw new Error(`Falta el Dockerfile de Backend en ${backend}. Revisá M2_E2E_BACKEND_DIR.`);
}

try {
  const start = performance.now();
  compose(["up", "--build", "--wait", "--wait-timeout", "120"]);
  const address = compose(["port", "frontend", "80"], "pipe").trim();
  const port = /^127\.0\.0\.1:(\d+)$/.exec(address)?.[1];
  if (!port) throw new Error(`El Frontend no publicó un puerto de loopback: ${address}`);
  console.log(`Stack listo en ${((performance.now() - start) / 1000).toFixed(1)} s.`);

  const playwright = join(app, "node_modules/@playwright/test/cli.js");
  const configs = process.argv.includes("--with-mocks")
    ? ["playwright.config.js", "playwright.real.config.js"]
    : ["playwright.real.config.js"];
  let failed = false;
  for (const config of configs) {
    const result = spawnSync(process.execPath, [playwright, "test", "--config", config], {
      cwd: app,
      env: {
        ...process.env,
        M2_E2E_FIXTURE_PASSWORD: env.M2_E2E_FIXTURE_PASSWORD,
        M2_E2E_URL: `http://localhost:${port}`,
      },
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    failed ||= result.status !== 0;
  }
  if (failed) throw new Error("Al menos una suite de Playwright falló.");
} catch (error) {
  console.error(`E2E falló: ${error.message}`);
  process.exitCode = 1;
  try {
    compose(["logs", "--no-color", "--tail", "50", "backend", "frontend"]);
  } catch {
    console.error("No se pudieron recuperar los logs del stack.");
  }
} finally {
  compose(["down", "--volumes", "--rmi", "local"]);
}
