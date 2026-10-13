terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
  }
}


variable "project" {
  type = string
}

#variable "credentials_file" { }

variable "region" {
  type = string
}

variable "firestore_region" {
  type = string
}

variable "tasks_region" {
  type = string
}


provider "google" {
  project = var.project
  region  = var.region
}


resource "random_id" "terraform_backend" {
  byte_length = 8
}

resource "google_storage_bucket" "terraform_backend" {
  name     = "${random_id.terraform_backend.hex}-terraform-remote-backend"
  location = "US"

  force_destroy               = false
  public_access_prevention    = "enforced"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "local_file" "terraform_backend" {
  file_permission = "0644"
  filename        = "${path.module}/backend.tf"

  # You can store the template in a file and use the templatefile function for
  # more modularity, if you prefer, instead of storing the template inline as
  # we do here.
  content = <<-EOT
  terraform {
    backend "gcs" {
      bucket = "${google_storage_bucket.terraform_backend.name}"
    }
  }
  EOT
}


resource "google_artifact_registry_repository" "cloud_run_source_deploy" {
  format        = "DOCKER"
  location      = var.region
  mode          = "STANDARD_REPOSITORY"
  repository_id = "repo"

  # Keep only the image Cloud Run is serving; Cloud Run re-pulls it on every
  # instance start, so keep_count must never drop below 1.
  cleanup_policy_dry_run = false
  cleanup_policies {
    id     = "keep-latest"
    action = "KEEP"
    most_recent_versions {
      keep_count = 1
    }
  }
  cleanup_policies {
    id     = "delete-rest"
    action = "DELETE"
    condition {
      tag_state = "ANY"
    }
  }

  depends_on = [google_project_service.artifactregistry_googleapis_com]
}

resource "google_service_account" "cloud_build" {
  account_id = "cloud-build"
}
resource "google_project_iam_member" "cloud_build_sa_run_binding" {
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
  role    = "roles/run.admin"
  project = var.project
}

resource "google_project_iam_member" "cloud_build_sa_run_sa_binding" {
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
  role    = "roles/run.serviceAgent"
  project = var.project
}

# Write to Cloud Logging API
resource "google_project_iam_member" "cloud_build_sa_log_binding" {
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
  role    = "roles/logging.logWriter"
  project = var.project
}

# Write logs to cloud bucket
resource "google_project_iam_member" "cloud_build_sa_storage_binding" {
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
  role    = "roles/storage.admin"
  project = var.project
}

# Push docker images
resource "google_project_iam_member" "cloud_build_sa_registry_binding" {
  member  = "serviceAccount:${google_service_account.cloud_build.email}"
  role    = "roles/artifactregistry.writer"
  project = var.project
}

resource "google_service_account" "app" {
  account_id = "backend-app"
}

resource "google_project_iam_member" "app_firestore_binding" {
  member = "serviceAccount:${google_service_account.app.email}"
  role   = "roles/datastore.user"
  condition {
    expression = "resource.name==\"projects/${var.project}/databases/meetings\""
    title      = "Limit access to one resource"
  }
  project    = var.project
  depends_on = [google_firestore_database.database]
}

resource "google_project_iam_member" "app_end-meetings_queue_binding" {
  member = "serviceAccount:${google_service_account.app.email}"
  # TODO enqueuer roles give permisson denied
  role = "roles/cloudtasks.admin"
  condition {
    expression = "resource.name==\"projects/${var.project}/locations/${var.tasks_region}/queues/end-meetings1\""
    title      = "Limit access to one resource"
  }
  project    = var.project
  depends_on = [google_cloud_tasks_queue.end_meetings]
}

resource "google_service_account_iam_member" "allow_act_as" {
  service_account_id = google_service_account.app.id
  role               = "roles/iam.serviceAccountUser"

  #TODO Create dedicated account
  member = "serviceAccount:${google_service_account.app.email}"
}

removed {
  from = google_service_account_iam_binding.allow_act_as

  lifecycle {
    destroy = false
  }
}

import {
  to = google_service_account_iam_member.allow_act_as
  id = "projects/no-meeting-overtime/serviceAccounts/backend-app@no-meeting-overtime.iam.gserviceaccount.com roles/iam.serviceAccountUser serviceAccount:backend-app@no-meeting-overtime.iam.gserviceaccount.com"
}

resource "google_project_service" "iam_googleapis_com" {
  service = "iam.googleapis.com"
}
# terraform import google_project_service.iam_googleapis_com 702188951486/iam.googleapis.com
resource "google_project_service" "cloudbuild_googleapis_com" {
  service = "cloudbuild.googleapis.com"
}
# terraform import google_project_service.cloudasset_googleapis_com 702188951486/cloudasset.googleapis.com
resource "google_project_service" "meet_googleapis_com" {
  service = "meet.googleapis.com"
}

resource "google_project_service" "cloudtasks_googleapis_com" {
  service = "cloudtasks.googleapis.com"
}

resource "google_project_service" "firestore_googleapis_com" {
  service = "firestore.googleapis.com"
}

resource "google_project_service" "artifactregistry_googleapis_com" {
  service = "artifactregistry.googleapis.com"
}
resource "google_project_service" "run_googleapis_com" {
  service = "run.googleapis.com"
}


resource "google_firestore_database" "database" {
  name        = "meetings"
  location_id = var.firestore_region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore_googleapis_com]
}

resource "google_cloud_tasks_queue" "end_meetings" {
  // TODO Rename after 04.12
  name     = "end-meetings1"
  location = var.tasks_region

  retry_config {
    max_attempts = 10
  }

  depends_on = [google_project_service.cloudtasks_googleapis_com]
}

