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

Los pull requests sólo validan el build de la aplicación y de la imagen. Los pushes a `dev` publican imágenes privadas en `ghcr.io/santimussi/front-desarrollo-apps-2` con los tags móviles `dev` e inmutables `sha-<commit-completo>`.

El despliegue automático sólo se ejecuta si la variable de GitHub `CD_ENABLED` vale exactamente `true`. El job llama por SSH al script versionado en Infra, enviando únicamente `frontend` y el SHA. La configuración manual y la operación están documentadas en `docs/runbook.md` del repositorio Infra.

El CD no utiliza GitHub Environments. En `Settings → Secrets and variables → Actions` deben configurarse como **Repository Variables** `CD_ENABLED`, `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_DEPLOY_PATH` y `LIGHTSAIL_KNOWN_HOSTS`; la clave dedicada se guarda únicamente como **Repository Secret** `LIGHTSAIL_SSH_PRIVATE_KEY`. Con `CD_ENABLED=false` la imagen GHCR se publica, pero el deploy automático se omite.
