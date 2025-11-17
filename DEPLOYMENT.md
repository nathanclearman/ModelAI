# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up at [railway.app](https://railway.app)**
2. **Create new project** → "Deploy from GitHub repo"
3. **Connect your GitHub repo** (push your code first)
4. **Set environment variables** in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=your_neon_postgres_url
   SESSION_SECRET=your_long_random_secret
   RESEND_API_KEY=your_resend_key
   RESEND_FROM=assistant@modelai.info
   OPENAI_API_KEY=your_openai_key
   STABILITY_API_KEY=your_stability_key
   AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_key
   AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
   ```
5. **Add custom domain** in Railway settings
6. **Deploy** - Railway auto-detects and builds

### Option 2: Render

1. **Sign up at [render.com](https://render.com)**
2. **New Web Service** → Connect GitHub repo
3. **Settings:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node
4. **Set environment variables** (same as Railway)
5. **Add custom domain** in Render dashboard

### Option 3: Fly.io

1. **Install Fly CLI**: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. **Login**: `fly auth login`
3. **Initialize**: `cd ModelAI && fly launch`
4. **Set secrets**: `fly secrets set DATABASE_URL=... SESSION_SECRET=...` etc.
5. **Deploy**: `fly deploy`

## Critical Issues - ✅ FIXED!

### 1. Image Storage ✅
**FIXED:** Now uses Cloudflare R2 with automatic fallback to local storage.

**To enable:**
1. Set up Cloudflare R2 (see `PRODUCTION_SETUP.md`)
2. Add R2 environment variables:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

**If R2 not configured:** Falls back to local `/tmp` storage (works for testing, not production)

### 2. Code Execution Security ✅
**FIXED:** Code execution can be disabled via environment variable.

**To disable (RECOMMENDED):**
```
ENABLE_CODE_EXECUTION=false
```

**To enable (NOT RECOMMENDED):**
```
ENABLE_CODE_EXECUTION=true
```

When disabled, code execution returns 403 error and UI handles it gracefully.

### 3. Environment Variables
Set ALL these in your hosting platform:
- `DATABASE_URL` (already have Neon)
- `SESSION_SECRET` (generate new random string)
- `RESEND_API_KEY` & `RESEND_FROM`
- `OPENAI_API_KEY`
- `STABILITY_API_KEY`
- `AI_INTEGRATIONS_GEMINI_API_KEY`
- `NODE_ENV=production`
- `PORT` (usually auto-set by platform)

### 4. Build & Start Commands
Your `package.json` already has:
- `build`: Builds frontend + bundles server
- `start`: Runs production server

Most platforms auto-detect these.

## Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Test email verification (check Resend dashboard)
- [ ] Test chat functionality
- [ ] Test image generation (if enabled)
- [ ] Test code execution (if enabled)
- [ ] Verify HTTPS is working
- [ ] Check database connection
- [ ] Monitor error logs

## Custom Domain Setup

1. **Get domain** (Namecheap, Google Domains, etc.)
2. **In Railway/Render:**
   - Go to Settings → Custom Domain
   - Add your domain
   - Follow DNS instructions
3. **Update DNS** at your domain registrar:
   - Add CNAME record pointing to Railway/Render URL
   - Or add A record if provided IP
4. **SSL** - Railway/Render auto-provisions SSL certificates

## Will It Work for All Users?

**YES, with these fixes:**
- ✅ Database (Neon) - already cloud-hosted
- ✅ Email (Resend) - already cloud service
- ✅ Authentication - will work
- ⚠️ Image storage - needs cloud storage fix
- ⚠️ Code execution - needs sandboxing fix
- ✅ Chat/AI features - will work
- ✅ All other features - will work

**Main blockers:**
1. Image storage must be moved to cloud (S3/R2)
2. Code execution needs proper sandboxing or disabling

Want me to help fix the image storage and code execution issues before you deploy?

