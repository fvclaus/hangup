# IAM wiring for the GitHub Actions deploy pipeline (.github/workflows/deploy.yml).
#
# Auth model: GitHub Actions authenticates via Workload Identity Federation
# (shared pool/provider in project fvclaus-workload-id-federation) and
# impersonates the existing `cloud-build` service account, which already holds
# the run.admin / artifactregistry.writer / logging / storage roles needed to
# build, push and deploy.

locals {
  github_repo = "fvclaus/hangup"
  # WIF principal for this repo. The shared provider maps google.subject to
  # assertion.repository, so the subject is the "<owner>/<repo>" slug.
  github_principal = "principal://iam.googleapis.com/projects/44054328514/locations/global/workloadIdentityPools/github/subject/${local.github_repo}"
}

# Allow the GitHub Actions WIF identity to impersonate the cloud-build SA.
resource "google_service_account_iam_member" "github_impersonate_cloud_build" {
  service_account_id = google_service_account.cloud_build.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.github_principal
}

# The cloud-build SA must be able to act as the runtime SA (backend-app) in
# order to deploy a Cloud Run revision that runs as that SA.
resource "google_service_account_iam_member" "cloud_build_act_as_app" {
  service_account_id = google_service_account.app.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.cloud_build.email}"
}

# CLIENT_SECRET is stored in Secret Manager (secret created outside Terraform).
# The runtime SA needs accessor rights so the container can read it at runtime
# via the Cloud Run --set-secrets reference.
data "google_secret_manager_secret" "client_secret" {
  secret_id = "client-secret"
}

resource "google_secret_manager_secret_iam_member" "app_client_secret_accessor" {
  secret_id = data.google_secret_manager_secret.client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app.email}"
}
