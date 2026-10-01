# Deploy on Google Cloud

This deploys the frontend and NestJS API as separate Cloud Run services. Cloud Build builds both images remotely from GitHub, so Docker or Podman is not needed on your computer. The API connects to Cloud SQL for PostgreSQL through the Cloud Run Cloud SQL integration.

## One-time Google Cloud setup

1. Select a Google Cloud project, enable billing, and enable Cloud Build, Cloud Run, Artifact Registry, Cloud SQL Admin, and Secret Manager APIs.
2. Create a PostgreSQL instance in Cloud SQL. Create a database named `taskbuilder` and a database user named `taskbuilder`. Save the instance connection name in `PROJECT_ID:REGION:INSTANCE_ID` format.
3. Add the database user's password to Secret Manager as `centaurio-db-password`.
4. Create a Docker Artifact Registry repository named `centaurio` in the same region used for Cloud Run.
5. Grant the Cloud Run runtime service account `Cloud SQL Client` and access to the `centaurio-db-password` secret. Grant the Cloud Build trigger service account permission to deploy Cloud Run services, write to Artifact Registry, and act as the runtime service account.
6. In Cloud Build, connect the `bhanudhara/centaurio` GitHub repository and create a trigger for pushes to `main`, using `cloudbuild.yaml`.
7. Set the trigger substitutions:
   - `_REGION`: region used for Cloud Run and Artifact Registry.
   - `_INSTANCE_CONNECTION_NAME`: Cloud SQL connection name from step 2.
   - `_DB_NAME`, `_DB_USER`, `_DB_SECRET`: change only if the names from steps 2-3 differ.

The first successful trigger builds and deploys `centaurio-api` and `centaurio-web`. Open the `centaurio-web` Cloud Run URL to use the app. The web service proxies `/api` requests to the API service, so no browser CORS configuration or frontend API URL edit is needed.

In production, TypeORM runs the checked-in initial migration instead of schema synchronization. Keep database passwords in Secret Manager; do not add them to GitHub or commit local `.env` files.

Cloud SQL has ongoing charges even when the app is idle. Review the selected instance tier and region before creating it.