# Frontend de Atención Ciudadana

La aplicación vive en `Front/frontend-atencion-ciudadana` y se construye con Node.js 22 y Vite.

## Desarrollo local

```bash
cd Front/frontend-atencion-ciudadana
npm ci
npm run dev
```

`VITE_API_BASE_URL` define la base de la API. En el contenedor y en CI se usa `/api`, para que Nginx actúe como proxy hacia Backend.

## Build

```bash
cd Front/frontend-atencion-ciudadana
npm ci
VITE_API_BASE_URL=/api npm run build
docker build --build-arg VITE_API_BASE_URL=/api -t frontend-local .
```

## CI, GHCR y CD

Los pull requests validan lint, cobertura (85 %), build y ambas suites Playwright. Los pushes a `main` pueden publicar imágenes privadas en `ghcr.io/santimussi/front-desarrollo-apps-2`. Los pushes a `dev` sólo validan.

El despliegue automático sólo se ejecuta si la variable de GitHub `CD_ENABLED` vale exactamente `true`. El job llama por SSH al script versionado en Infra, enviando el servicio `frontend`, el digest publicado y el proveedor seleccionado. La configuración manual y la operación están documentadas en `docs/runbook.md` del repositorio Infra.

El CD no utiliza GitHub Environments. En `Settings → Secrets and variables → Actions` deben configurarse como **Repository Variables** `CD_ENABLED`, `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_DEPLOY_PATH` y `LIGHTSAIL_KNOWN_HOSTS`; la clave dedicada se guarda únicamente como **Repository Secret** `LIGHTSAIL_SSH_PRIVATE_KEY`. Con `CD_ENABLED=false` la imagen GHCR se publica, pero el deploy automático se omite.

## E2E con Backend real

Los cinco escenarios en `e2e/real` recorren el alta, el seguimiento por código, la consulta propia con control de permisos, la toma en revisión y la resolución con cierre confirmado. Chrome usa el Frontend compilado, Nginx proxifica `/api` a Spring y Flyway inicializa una base PostgreSQL nueva. La suite verifica respuestas del navegador y lecturas independientes del Backend.

El entorno usa usuarios sintéticos del proveedor de identidad **MOCK**. Core, RabbitMQ, IA y el simulador de eventos quedan fuera de esta suite. Se bloquean los recursos web de terceros y las solicitudes al origen local siguen por HTTP normal. Compose publica sólo Nginx en un puerto dinámico de loopback y elimina el proyecto y su volumen al terminar, incluso si Playwright falla.

Para ejecutar desde PowerShell con Node.js 22, Chrome y Docker Compose con contenedores Linux, mantené el checkout de Backend como hermano del repositorio Frontend. Si está en otra ubicación, indicá la ruta absoluta en `M2_E2E_BACKEND_DIR`.

```powershell
cd Front/frontend-atencion-ciudadana
npm ci
$env:VITE_IDENTITY_PROVIDER = 'MOCK'
$env:VITE_API_BASE_URL = '/api'
npm run build
npm run test:e2e:real
```

Usá `npm run test:e2e:real -- --with-mocks` para ejecutar los 9 escenarios existentes y los 5 reales en el mismo arranque. `npm run test:e2e` conserva la ejecución independiente con API simulada. El reporte real queda en `playwright-report/real`.

En CI se ejecutan ambos grupos en el job `e2e` de PR, ramas principales del flujo y tags. El workflow descarga el Backend público por SHA y registra esa revisión en el resumen. El job reutiliza el bundle MOCK de `validate`. Si el build de publicación usa M1, prepara un único bundle MOCK para ambas suites.

## Tags y escaneo de secretos

Los tags `v*`, incluido `v2.0-entrega4`, ejecutan las suites actuales y builds
sobre el commit etiquetado, sin publicar en GHCR ni desplegar. Se publican cobertura,
Playwright y resumen de secretos también al fallar; el resumen del job registra ref/SHA.
La publicación manual M1 conserva sus condiciones.

Desde la raíz: `python .github/scripts/check-secrets.py` (Python 3.11+ y Git).
Descarga Gitleaks 8.30.1 oficial temporalmente y verifica SHA-256. Escanea todo el
historial de las refs locales y archivos versionables actuales, incluidos untracked
no ignorados; requiere clon completo y no descarga refs automáticamente.
`--gitleaks <ruta>` usa una instalación de esa versión y `--output <archivo-fuera-del-repo.json>`
guarda metadata sin valores. Los `.env` privados ignorados no deben agregarse a Git.
No subir reportes crudos ni credenciales. No se excluyen directorios de tests ni commits.
Publicar y desplegar requiere G6 exitoso además de los gates existentes, también en la
publicación manual M1. Si G6 falla, se cancela o se omite, no se publica ni despliega.
