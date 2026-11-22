FROM golang:1.27.4-alpine@sha256:0a5f7fe796599ff487605987432e7619ae45beeb2fba4c2ce0b907879932aebf AS esbuild-source

COPY docker/esbuild.go.mod docker/esbuild.go.sum /tmp/

# Preserve Vite 6's esbuild API while fixing the Go runtime and x/sys in its binary.
RUN apk add --no-cache curl \
    && mkdir /src /out \
    && curl --proto '=https' --proto-redir '=https' --fail --silent --show-error --location \
      --output /tmp/esbuild.tar.gz https://codeload.github.com/evanw/esbuild/tar.gz/refs/tags/v0.25.12 \
    && echo 'eca56e4242e68ebde6f327458c71457e614a2b0564b30a45d60fc633e0ccaab4  /tmp/esbuild.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/esbuild.tar.gz -C /src --strip-components=1 \
    && cd /src \
    && cp /tmp/esbuild.go.mod go.mod && cp /tmp/esbuild.go.sum go.sum \
    && go mod download all && go mod verify \
    && go test -mod=readonly ./internal/... ./pkg/api/... \
    && CGO_ENABLED=0 go build -mod=readonly -trimpath -ldflags='-s -w' -o /out/esbuild ./cmd/esbuild

FROM scratch AS esbuild-tool
COPY --from=esbuild-source /out/esbuild /esbuild

FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS build

RUN npm install --global --ignore-scripts npm@11.21.2
COPY --from=esbuild-tool /esbuild /usr/local/bin/esbuild-patched
COPY docker/patch-esbuild.sh /usr/local/bin/patch-esbuild

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && sh /usr/local/bin/patch-esbuild /usr/local/bin/esbuild-patched

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_IDENTITY_PROVIDER=MOCK
ENV VITE_IDENTITY_PROVIDER=${VITE_IDENTITY_PROVIDER}

RUN npm run build

FROM nginx:1.30.7-alpine@sha256:caf4e1e032a20f9c3c5e28fc7f25ffd768ad8677b4975c54193075997b3a97e3 AS runtime

# Security patch within the image's Alpine branch; keep the Nginx configuration intact.
RUN apk add --no-cache --upgrade 'libxslt>=1.1.43-r4'

# Keep both existing HTTP listeners while running the master and workers as nginx.
RUN sed -i '/^user /d; s|/var/run/nginx.pid|/tmp/nginx.pid|; s|/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

USER nginx

CMD ["nginx", "-g", "daemon off;"]
