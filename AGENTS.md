# no-meeting-overtime — Agent Reference

## What this project does

A Next.js web app that lets users schedule an automatic end time for Google Meet meetings. Users sign in with Google OAuth2, create a meeting with an end time, and a Cloud Tasks job calls the Google Meet API to end the conference at the scheduled time.

## Architecture

- **Framework**: Next.js (App Router, standalone output mode)
- **Auth**: Google OAuth2 via `google-auth-library`. Session state stored in Firestore (`meetings` database, `session` collection).
- **Database**: Firestore (`meetings` database) — stores sessions, meetings, and users.
- **Scheduling**: Google Cloud Tasks queue (`end-meetings1`) sends an HTTP DELETE to `/api/meeting/[meetingCode]` with an OIDC token at the scheduled end time.
- **Hosting**: Cloud Run (europe-west1), built and deployed by the Deploy workflow (`.github/workflows/deploy.yml`).
- **Container**: Multi-stage Docker build using a distroless Node.js image. Uses Next.js standalone output (`apps/api/next.config.js` must include `output: 'standalone'`).

## Key environment variables (set in Cloud Run)

| Variable | Purpose |
|---|---|
| `CLIENT_ID` | Google OAuth2 client ID |
| `CLIENT_SECRET` | Google OAuth2 client secret |
| `PROJECT_ID` | GCP project ID (`no-meeting-overtime`) |
| `QUEUE_LOCATION` | Cloud Tasks region (`europe-west1`) |
| `SITE_BASE` | Public base URL (`https://no-meeting-overtime.click`) |
| `CLOUD_TASKS_SERVICE_ACCOUNT` | SA email used to sign Cloud Tasks OIDC tokens |

## Important: no server-side self-referential HTTP fetches

Server components and server actions **must not** fetch the app's own API routes over HTTP using `SITE_BASE`. DNS for `no-meeting-overtime.click` may not resolve inside the Cloud Run network, causing 500 errors on cold starts.

**Wrong pattern:**
```typescript
// BAD — DNS may not resolve from Cloud Run
const res = await fetch(`${SITE_BASE}/api/userinfo`, { headers: { Cookie: ... } });
```

**Correct pattern:**
```typescript
// GOOD — call the underlying function directly
import { getSession } from "@/app/session-store";
const sessionData = await getSession();
```

The route handler logic is importable; prefer calling it directly from server components.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): runs lint, unit tests, and Playwright component tests on every PR/push to `main`. Does not deploy. Note: CI does **not** run `next build`, so type errors / build breakages are only caught by the Deploy workflow.
- **Deploy** (`.github/workflows/deploy.yml`): on push to `main` (and temporarily on `pull_request` while the pipeline is being validated), authenticates to GCP via Workload Identity Federation (impersonating the `cloud-build` service account), builds the Docker image, pushes it to Artifact Registry (`europe-west1-docker.pkg.dev/.../repo`), and deploys to Cloud Run (`app`, europe-west1). Non-secret env vars come from GitHub repo **variables**; `CLIENT_SECRET` is injected from Secret Manager (`client-secret`) via `--set-secrets`. IAM wiring lives in `github_actions.tf`.

## Testing

```bash
pnpm test:unit   # vitest unit tests
pnpm test:ct     # Playwright component tests (requires Docker)
pnpm lint        # ESLint + Prettier via eslint
```

### Updating Playwright CT snapshots

Snapshots must be updated locally (never via CI):

```bash
pnpm test:ct:update-snapshots
```

This rebuilds the Docker image and runs Playwright with `--update-snapshots`, writing new baseline images to `__snapshots__/`. Commit the updated snapshots.

### E2E tests

Setup is described in README.md ("E2E Tests"). In short:

1. **Chrome** with `--remote-debugging-port=9222`, logged in to the test Google account.
2. **ngrok** to the backend: `ngrok http 3001`; its URL goes into `SITE_BASE_CLOUD_TASKS` in `apps/api/.env.local`.
3. **Backend** on port 3001 (`pnpm -C apps/api dev`, or the Docker image built with `--build-arg NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET=0`).
4. **Web app** on port 3000 (`pnpm -C apps/web dev`) with `NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET=0` in `apps/web/.env.local`.
5. **Run**: `GMAIL_USER=you@gmail.com pnpm -C apps/web test:e2e`

`GMAIL_USER` is required when multiple Google accounts are signed in.

**VS Code Playwright extension**: Requires the same Chrome and ngrok setup as the CLI — the extension does not start Chrome or the dev server for you.

## Local development

Set `SITE_BASE=http://localhost:3000` and other required env vars, then:
```bash
pnpm dev
```
For Cloud Tasks callbacks locally you need a public HTTPS URL (e.g. ngrok). Set `SITE_BASE_CLOUD_TASKS` to the ngrok URL.

## Firestore collections

| Collection | Key | Contents |
|---|---|---|
| `session` | session UUID | `SessionData` — auth state, credentials, user info |
| `meeting` | meeting code | `Meeting` — `scheduledEndTime`, `name`, `userId`, `uri` |
| `user` | userId | `{ refresh_token }` |

## Cloud Tasks DELETE callback authentication

`DELETE /api/meeting/[meetingCode]` is called by Cloud Tasks with an OIDC token. The handler:
1. Verifies `X-CLOUDTASKS-TASKNAME` header is present.
2. Verifies the OIDC `Authorization` bearer token email matches `CLOUD_TASKS_SERVICE_ACCOUNT`.
3. Looks up the user's refresh token from Firestore and calls the Google Meet API.
