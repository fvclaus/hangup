# Backend (Cloud Run) image for the @nmo/api workspace app.
#
# Build context is the repo ROOT (monorepo): we install the whole pnpm workspace
# (api + @nmo/shared), build apps/api, then run `next start`. The GCP SDKs
# (@google-cloud/firestore, @google-cloud/tasks, googleapis) authenticate via the
# Cloud Run runtime service account (ADC) — no key file is shipped.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && npm i -g pnpm
WORKDIR /app

FROM base AS build
# Workspace manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile
# Sources.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder env so module-level reads / prerender don't fail during build.
ENV CLIENT_SECRET=foo \
    CLIENT_ID=foo \
    PROJECT_ID=foo \
    QUEUE_LOCATION=foo \
    SITE_BASE=http://localhost \
    CLOUD_TASKS_SERVICE_ACCOUNT=foo@foo.iam.gserviceaccount.com
RUN pnpm -C apps/api build

ENV NODE_ENV=production
EXPOSE 8080
# Cloud Run provides $PORT (default 8080). next start honours it.
CMD ["sh", "-c", "cd apps/api && exec node_modules/.bin/next start -p ${PORT:-8080}"]
