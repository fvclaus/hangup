# No Meeting Overtime

https://hangup.f-v-claus.workers.dev/

![Website screenshot](docs/website_screenshot.png)

## What This Project Does

No Meeting Overtime is a web application designed to help you manage your Google Meet meetings more effectively. It allows you to set a predefined end time for your meetings, ensuring they conclude on schedule and helping you avoid meetings that run over. Users can sign in with their Google account to create and manage these timed meetings.

## Technologies Used

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [React](https://reactjs.org/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Services:**
    *   Google Meet APIs
    *   Google Cloud Firestore
*   **Development & Testing:**
    *   [Playwright](https://playwright.dev/) (for component testing)
    *   [Vitest](https://vitest.dev/) (for unit testing)
*   **Package Manager:**
    *   [pnpm](https://pnpm.io/) (deduced from `pnpm-lock.yaml`)

## How to Start the Project

To get the project running locally for development, follow these steps:

1.  **Install dependencies:**
    It's recommended to use `pnpm` as indicated by the `pnpm-lock.yaml` file.
    ```bash
    pnpm install
    ```
    *(If you prefer npm or yarn, you can try `npm install` or `yarn install`, but `pnpm` is preferred for consistency with the lock file.)*

3.  **Set up environment variables:**
    The google cloud libraries use ADC (application default credentials) for authentication: https://cloud.google.com/docs/authentication/application-default-credentials

4.  **Run the development server:**
    ```bash
    pnpm run dev
    ```
    This will start the Next.js development server
---

## Build and deploy locally

- Authenticate to the docker repository: https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling#auth
- Make sure that your current configuration has an account linked: `gcloud config configuration list`
- Build: `docker build . -t europe-west1-docker.pkg.dev/no-meeting-overtime/repo/no-meeting-overtime:latest`
- Push: `docker push europe-west1-docker.pkg.dev/no-meeting-overtime/repo/no-meeting-overtime:latest`

## Environment Configuration

`PROJECT_ID` is the Google Cloud Project id

### Cloud Task configuration

- **Go to the [Google Cloud Console](https://console.cloud.google.com/).**
- **Select your project**
- Go to **IAM & Admin > Service Accounts**.
- Find the service account (e.g., `backend-app@no-meeting-overtime.iam.gserviceaccount.com`) and store it as `CLOUD_TASKS_SERVICE_ACCOUNT`
- Go to the **"Keys"** tab and create a new key and store the path to the service account key file in `KEY_FILE`
- Store the region of the queue in `QUEUE_LOCATION` (this is an input variable to terraform), its name is hardcoded in the terraform configuration
- The local dev server needs to be publicly available for Google Cloud Tasks to reach it (e.g. using ngrok). The public url must be stored in `SITE_BASE_CLOUD_TASKS`

### Google OAuth configuration

3. In the left sidebar, go to **APIs & Services > Credentials**.
4. Under **OAuth 2.0 Client IDs**, find your client (or create a new one by clicking **Create Credentials > OAuth client ID**).
5. Click on the client name to view details.
6. Copy the **Client ID** and **Client Secret** and paste them into your .env.local file as `CLIENT_ID` and `CLIENT_SECRET`.


## E2E Tests

E2E tests drive a real Chrome browser via the Chrome DevTools Protocol (CDP) and need an active Google login, because automated login is blocked by 2FA. They run against the local web app (`apps/web`, port 3000), which forwards `/api/*` to the backend (`apps/api`, port 3001). The backend uses the real Firestore database and Cloud Tasks queue of the project.

### 1. Start Chrome with remote debugging

Close all Chrome windows first (otherwise the command attaches to the running instance and no debugging port is opened):

```bash
google-chrome-stable --user-data-dir=<home folder "~" not supported>/.chrome-debugging-user-dir --remote-debugging-port=9222
```

If the terminal prints `Opening in existing browser session.`, close all Chrome windows and try again. In the browser that opened, log in to the Google account you want to test with.

### 2. Start ngrok

The "happy path" test creates a real meeting and waits for Cloud Tasks to call `DELETE /api/meeting/[meetingCode]` on the backend at the scheduled end. Cloud Tasks needs a public HTTPS URL for that:

```bash
ngrok http 3001
```

Install ngrok natively (e.g. via its apt repository), not from snap: the snap cannot write its config to `~/.config/ngrok`.

### 3. Configure the backend

Create `apps/api/.env.local`:

```
CLIENT_ID=<OAuth client id>
CLIENT_SECRET=<OAuth client secret, from Secret Manager "client-secret">
PROJECT_ID=no-meeting-overtime
QUEUE_LOCATION=europe-west1
SITE_BASE=http://localhost:3000
SITE_BASE_CLOUD_TASKS=<ngrok forwarding URL>
CLOUD_TASKS_SERVICE_ACCOUNT=backend-app@no-meeting-overtime.iam.gserviceaccount.com
NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET=0
```

`http://localhost:3000/api/get-token` must be an authorized redirect URI of the OAuth client. Google credentials come from ADC, or from `GOOGLE_OAUTH_ACCESS_TOKEN` if it is set.

### 4. Start the backend

Either run the production image (tests the Dockerfile too):

```bash
docker build -f apps/api/Dockerfile --build-arg NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET=0 -t hangup-api:e2e .
docker run --rm -p 3001:8080 --env-file apps/api/.env.local -e GOOGLE_OAUTH_ACCESS_TOKEN hangup-api:e2e
```

or the dev server:

```bash
pnpm -C apps/api dev
```

`NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET` is inlined at build time, so the image needs it as a build argument to allow the test's 30-second meeting.

### 5. Start the web app

Create `apps/web/.env.local`:

```
NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET=0
API_ORIGIN=http://localhost:3001
```

```bash
pnpm -C apps/web dev
```

### 6. Run the tests

```bash
# GMAIL_USER is required when multiple Google accounts are signed in.
GMAIL_USER=you@gmail.com pnpm -C apps/web test:e2e
```

> **Note:** The VS Code Playwright extension requires the same Chrome and ngrok setup as the CLI — it does not start Chrome or the dev server for you.


## Infrastructure (Terraform)

All GCP resources are defined in `terraform/`; the state lives in a GCS bucket (`terraform/backend.tf`). `terraform/tf.sh` runs Terraform from any directory, initializes it and checks for credentials first:

```bash
gcloud auth application-default login   # or export GOOGLE_OAUTH_ACCESS_TOKEN
terraform/tf.sh plan
terraform/tf.sh apply
```

Install gcloud natively, not from snap: the snap cannot install the Terraform extension.

Troubleshooting:

`storage: object doesn't exist`? -> `gcloud auth application-default set-quota-project no-meeting-overtime`

`oauth2: "invalid_grant" "Token has been expired or revoked."`? -> `gcloud auth application-default login`
