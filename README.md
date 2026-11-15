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

Los pull requests validan lint, cobertura (85%), build y Playwright con API simulada. Los pushes a `dev` publican imágenes privadas en `ghcr.io/santimussi/front-desarrollo-apps-2` con los tags móviles `dev` e inmutables `sha-<commit-completo>`.

El despliegue automático sólo se ejecuta si la variable de GitHub `CD_ENABLED` vale exactamente `true`. El job llama por SSH al script versionado en Infra, enviando el servicio `frontend`, el digest publicado y el proveedor seleccionado. La configuración manual y la operación están documentadas en `docs/runbook.md` del repositorio Infra.

El CD no utiliza GitHub Environments. En `Settings → Secrets and variables → Actions` deben configurarse como **Repository Variables** `CD_ENABLED`, `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_DEPLOY_PATH` y `LIGHTSAIL_KNOWN_HOSTS`; la clave dedicada se guarda únicamente como **Repository Secret** `LIGHTSAIL_SSH_PRIVATE_KEY`. Con `CD_ENABLED=false` la imagen GHCR se publica, pero el deploy automático se omite.

## Tags y escaneo de secretos

Los tags `v*`, incluido `v2.0-entrega4`, ejecutan las suites actuales y builds
sobre el commit etiquetado, sin publicar en GHCR ni desplegar. Se publican cobertura,
Playwright y resumen de secretos también al fallar; el resumen del job registra ref/SHA.
Los pushes habituales de `dev` y la publicación manual M1 conservan sus condiciones.
Sonar y la integración E2E con Backend real siguen pendientes; no los sustituye este CI.

Desde la raíz: `python .github/scripts/check-secrets.py` (Python 3.11+ y Git).
Descarga Gitleaks 8.30.1 oficial temporalmente y verifica SHA-256. Escanea todo el
historial de las refs locales y archivos versionables actuales, incluidos untracked
no ignorados; requiere clon completo y no descarga refs automáticamente.
`--gitleaks <ruta>` usa una instalación de esa versión y `--output <archivo-fuera-del-repo.json>`
guarda metadata sin valores. Los `.env` privados ignorados no deben agregarse a Git.
No subir reportes crudos ni credenciales. No se excluyen directorios de tests ni commits.
Publicar y desplegar requiere G6 exitoso además de los gates existentes, también en la
publicación manual M1. Si G6 falla, se cancela o se omite, no se publica ni despliega.
