#!/usr/bin/env bash
# Runs Terraform against the project's infrastructure from any directory.
#
# Usage:
#   terraform/tf.sh plan
#   terraform/tf.sh apply
#   terraform/tf.sh <any terraform subcommand> [args...]
#
# Credentials: Application Default Credentials
# (`gcloud auth application-default login`) or GOOGLE_OAUTH_ACCESS_TOKEN.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <terraform subcommand> [args...]" >&2
  exit 2
fi

if [ -z "${GOOGLE_OAUTH_ACCESS_TOKEN:-}" ] &&
  ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  echo "No Google credentials. Run 'gcloud auth application-default login'" \
    "or set GOOGLE_OAUTH_ACCESS_TOKEN." >&2
  exit 1
fi

cd "$(dirname "$0")"
terraform init -input=false
terraform "$@"
