# Coolify Deployment Guide

## Environment Variables

Copy and paste these into your Coolify project's **Environment Variables** section.

```env
# Database
# In Coolify, if you use a managed Postgres, use the internal connection string.
DATABASE_URL="postgresql://user:password@host:5432/jobline_db"

# Database
# In Coolify, if you use a managed Postgres, use the internal connection string.
DATABASE_URL="postgresql://user:password@host:5432/jobline_db"

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="jobline-files"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# App Configuration
# This should match your production domain
NEXT_PUBLIC_APP_URL="https://your-domain.com"
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
