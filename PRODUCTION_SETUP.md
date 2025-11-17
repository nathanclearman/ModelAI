# Production Setup Guide

## Quick Start Checklist

- [ ] Set up Cloudflare R2 for image storage
- [ ] Configure all environment variables
- [ ] Set `ENABLE_CODE_EXECUTION=false` (recommended)
- [ ] Test deployment locally with production config
- [ ] Deploy to hosting platform
- [ ] Verify all features work

## 1. Cloudflare R2 Setup (REQUIRED)

### Step 1: Create R2 Bucket
1. Sign up at [cloudflare.com](https://cloudflare.com) (free)
2. Go to **R2** in dashboard
3. Click **Create bucket**
4. Name it (e.g., `modelai-images`)
5. Set **Public Access** if you want public images

### Step 2: Get API Credentials
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions: **Object Read & Write**
4. Copy:
   - **Account ID** (found in R2 dashboard URL or sidebar)
   - **Access Key ID**
   - **Secret Access Key**

### Step 3: Set Environment Variables
Add to your hosting platform:
```
R2_ACCOUNT_ID=ba4351dab80e771fd255ee03454a83a2
R2_ACCESS_KEY_ID=38dbfb4b8848ae2aed739214d63fe303
R2_SECRET_ACCESS_KEY=8776e0e44fe716951bb0ac45350a0776223caf1f3ef153527ae36ea915b4a59a
R2_BUCKET_NAME=modelai-images
```

### Step 4: (Optional) Custom Domain
1. In R2 bucket settings, go to **Public Access**
2. Connect a custom domain (e.g., `images.yourdomain.com`)
3. Add DNS CNAME record pointing to R2
4. Set `R2_PUBLIC_DOMAIN=images.yourdomain.com`

## 2. Code Execution Security

**IMPORTANT:** Code execution is a security risk in production.

### Recommended: Disable Code Execution
Set in environment variables:
```
ENABLE_CODE_EXECUTION=true
```

This will:
- Hide/disable "Run" buttons on code blocks
- Return 403 error if someone tries to execute code
- Keep your server safe from malicious code

### If You Must Enable It:
1. Use Docker-based sandboxing
2. Implement resource limits (CPU, memory, time)
3. Use a separate isolated service
4. Monitor all executions
5. Set `ENABLE_CODE_EXECUTION=true`

## 3. Environment Variables

Copy `.env.production.example` and set all values:

### Required:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `SESSION_SECRET` - Random secure string (generate: `openssl rand -base64 32`)
- `RESEND_API_KEY` & `RESEND_FROM` - Email service
- `R2_*` - Cloudflare R2 credentials (see above)

### Optional but Recommended:
- `OPENAI_API_KEY` - For OpenAI models
- `STABILITY_API_KEY` - For image generation
- `AI_INTEGRATIONS_GEMINI_API_KEY` - For Gemini models

### Security:
- `ENABLE_CODE_EXECUTION=false` - Disable code execution (recommended)

## 4. Deployment Platforms

### Railway (Easiest)
1. Push code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. **New Project** → **Deploy from GitHub repo**
4. Add all environment variables in Railway dashboard
5. Railway auto-detects and deploys
6. Add custom domain in Railway settings

### Render
1. Push code to GitHub
2. Sign up at [render.com](https://render.com)
3. **New Web Service** → Connect GitHub
4. Settings:
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. Add environment variables
6. Add custom domain

### Fly.io
1. Install Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Login: `fly auth login`
3. Initialize: `fly launch`
4. Set secrets: `fly secrets set DATABASE_URL=... SESSION_SECRET=...`
5. Deploy: `fly deploy`

## 5. Post-Deployment

### Verify:
- [ ] User registration works
- [ ] Email verification sends
- [ ] Login/logout works
- [ ] Chat/AI features work
- [ ] Image generation/uploads work (check R2 bucket)
- [ ] Code blocks render (but don't execute if disabled)
- [ ] HTTPS is enabled
- [ ] Database connection works

### Monitor:
- Check error logs in hosting platform
- Monitor R2 bucket usage
- Check database connection pool
- Monitor API rate limits

## 6. Troubleshooting

### Images not working?
- Check R2 credentials are correct
- Verify bucket exists and is accessible
- Check `R2_PUBLIC_DOMAIN` if using custom domain
- Verify bucket has public read access

### Code execution errors?
- If disabled: This is expected, set `ENABLE_CODE_EXECUTION=true` if needed
- If enabled: Check Python/Node.js are installed on server
- Check execution timeout (5 seconds)

### Database connection issues?
- Verify `DATABASE_URL` is correct
- Check Neon database is running
- Verify SSL mode in connection string

### Email not sending?
- Check Resend API key is valid
- Verify `RESEND_FROM` domain is verified in Resend
- Check Resend dashboard for errors

## 7. Security Best Practices

1. **Never commit `.env` files** - Use hosting platform env vars
2. **Use strong `SESSION_SECRET`** - Generate random 32+ character string
3. **Disable code execution** - Set `ENABLE_CODE_EXECUTION=false`
4. **Enable HTTPS** - Most platforms do this automatically
5. **Monitor logs** - Watch for suspicious activity
6. **Keep dependencies updated** - Run `npm audit` regularly
7. **Use environment-specific configs** - Don't use dev configs in production

## Support

If you encounter issues:
1. Check hosting platform logs
2. Verify all environment variables are set
3. Test locally with production config
4. Check this guide's troubleshooting section

