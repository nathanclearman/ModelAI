# Installation & Setup

## After Cloning/Pulling

If you just pulled the latest changes, you need to install the new dependency:

```bash
npm install
```

This will install `@aws-sdk/client-s3` which is required for Cloudflare R2 image storage.

## Local Development

Use the existing `start-local.ps1` script - it works as before.

## Production Deployment

See `PRODUCTION_SETUP.md` for complete production deployment guide.

## New Features

### Cloudflare R2 Image Storage
- Automatically uses R2 if credentials are configured
- Falls back to local storage if R2 not configured
- See `PRODUCTION_SETUP.md` for R2 setup instructions

### Code Execution Toggle
- Set `ENABLE_CODE_EXECUTION=false` to disable (recommended for production)
- Set `ENABLE_CODE_EXECUTION=true` to enable (development only)

