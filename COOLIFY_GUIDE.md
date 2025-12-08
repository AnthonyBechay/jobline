# Coolify Deployment Guide

## Environment Variables

Copy and paste these into your Coolify project's **Environment Variables** section.

```env
# Database
DATABASE_URL="postgres://postgres:tOqKMrnDmBd1UQN1Q6c34KZ3FMGJs0FstEATDS7FHJd6BiLyRnrFsfDfq33dPVrs@p4wows8skoks8kkksggg8gwk:5432/jobline"

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID="e57d99b88be371aab5a1bf29839b9a2e"
R2_ACCESS_KEY_ID="754ac6be3066ce735248d8163c287f78"
R2_SECRET_ACCESS_KEY="47fabf1adeef8027b0bf703bba06a42c934dad8ddfca3e38d56052f57aac80ed"
R2_BUCKET_NAME="jobline"
# Note: This looks like the S3 endpoint. For public access, you usually need a public domain (e.g., https://pub-xxx.r2.dev).
# If this bucket is not public, images might not load.
R2_PUBLIC_URL="https://e57d99b88be371aab5a1bf29839b9a2e.r2.cloudflarestorage.com/jobline"

# App Configuration
NEXT_PUBLIC_APP_URL="https://jobline.37.27.181.201.sslip.io"
NODE_ENV="production"

# Optional: Email Configuration (SMTP)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@jobline.com"

# Optional: SMS Configuration
SMS_API_KEY="your-sms-api-key"
SMS_SENDER="JOBLINE"

# File Upload Limits
MAX_FILE_SIZE="10485760"
```

## Domains Configuration

In Coolify, you need to configure the **Domains** for your resource.

Since this is a **Next.js** application, it serves both the **Frontend** (UI) and **Backend** (API/Server Actions) from the same application.

1.  **Frontend Domain**: Set this to your main domain (e.g., `https://app.jobline.com`).
2.  **Backend Domain**: Since it's the same app, you don't need a separate domain. Your API routes will be available at `https://app.jobline.com/api/...`.

**Important**: Ensure that `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` both match the domain you configure in Coolify.

## Deployment Strategy: Docker Compose vs Nixpacks

Since you asked about the difference:

*   **Docker (Docker Compose)**: Uses your custom `Dockerfile` and `docker-compose.yml`.
    *   **Pros**: You have full control. Your `Dockerfile` is already optimized (multi-stage, standalone output). It allows you to deploy the Database and App together in one stack easily.
    *   **Cons**: You have to maintain the Dockerfile (which you already have).
*   **Nixpacks**: Automatically detects that this is a Next.js app and builds it without needing a Dockerfile.
    *   **Pros**: Zero configuration if you don't have a Dockerfile.
    *   **Cons**: Less control over the build process.

**Recommendation: Use Docker Compose**
Since you already have a high-quality `Dockerfile` and `docker-compose.yml`, and you are comfortable with it, **stick with Docker Compose**.

### How to Deploy with Docker Compose in Coolify

1.  Create a new **Resource** -> **Docker Compose**.
2.  Copy the contents of your `docker-compose.yml` into the configuration area.
3.  **Important**: Go to the **Environment Variables** tab and paste all the variables listed above.
    *   Your `docker-compose.yml` is already set up to read these variables (e.g., `DATABASE_URL=${DATABASE_URL}`), so Coolify will inject them automatically.
4.  Deploy!

### Note on Domains
Even with Docker Compose, you configure the **Domains** in the Coolify UI (Service Configuration), not in the YAML file. Set your domain (e.g., `https://app.jobline.com`) there.
