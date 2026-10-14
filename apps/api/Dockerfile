# Backend (Cloud Run) image for the @hangup/api workspace app.
#
# Build context is the repo ROOT (monorepo). The build stage installs the whole
# pnpm workspace and builds apps/api with `output: "standalone"`; the runtime
# stage ships only the traced standalone output on a distroless Node image.
# The GCP SDKs authenticate via the Cloud Run runtime service account (ADC) —
# no key file is shipped.
FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat && npm i -g pnpm
WORKDIR /app
# Workspace manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile --filter @hangup/api...
COPY . .
# Inlined into the bundle at build time; e2e builds pass 0 to allow short
# meetings. Unset in production, which falls back to the default.
ARG NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder env so module-level reads / prerender don't fail during build.
ENV CLIENT_SECRET=foo \
    CLIENT_ID=foo \
    PROJECT_ID=foo \
    QUEUE_LOCATION=foo \
    SITE_BASE=http://localhost \
    CLOUD_TASKS_SERVICE_ACCOUNT=foo@foo.iam.gserviceaccount.com
RUN pnpm -C apps/api build

FROM gcr.io/distroless/nodejs22-debian12 AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080
COPY --from=build /app/apps/api/.next/standalone ./
COPY --from=build /app/apps/api/.next/static ./apps/api/.next/static
USER nonroot
EXPOSE 8080
# Cloud Run provides $PORT (default 8080); the standalone server.js honours it.
CMD ["apps/api/server.js"]
