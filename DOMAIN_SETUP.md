# Domain Connection Guide

## After Nameserver Verification - Next Steps

Once your nameservers are verified, follow these steps to connect your ModelAI site to your domain.

## Step 1: Configure Domain in Your Hosting Platform

### If Using Railway:
1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** → **Networking**
4. Click **Add Custom Domain**
5. Enter your domain (e.g., `yourdomain.com` or `www.yourdomain.com`)
6. Railway will provide DNS records to add (if not already done)
7. Wait for DNS propagation (usually 5-15 minutes)
8. Railway automatically provisions SSL certificate

### If Using Render:
1. Go to your Render dashboard
2. Select your web service
3. Go to **Settings** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter your domain
6. Follow DNS instructions (usually CNAME to `your-service.onrender.com`)
7. Render auto-provisions SSL (may take a few minutes)

### If Using Fly.io:
1. Run: `fly domains add yourdomain.com`
2. Follow DNS instructions provided
3. SSL is automatically provisioned

### If Using Vercel:
1. Go to project settings → **Domains**
2. Add your domain
3. Follow DNS instructions
4. SSL auto-provisions

## Step 2: Update Environment Variables

After your domain is connected, update these environment variables in your hosting platform:

### Required for Production Domain:
```bash
# Your production domain (without https://)
DOMAIN=yourdomain.com

# Or if using www subdomain
DOMAIN=www.yourdomain.com

# Base URL for the application
BASE_URL=https://yourdomain.com

# Image base URL (should match your domain)
IMAGE_BASE_URL=https://yourdomain.com
```

### Update Email Configuration:
The email verification links will automatically use your domain if you set:
```bash
# Production domain (used for email links)
REPLIT_DOMAINS=yourdomain.com,www.yourdomain.com

# Or if your platform uses a different variable:
PRODUCTION_DOMAIN=yourdomain.com
```

### Complete Environment Variables List:
```bash
# Core Configuration
NODE_ENV=production
PORT=5000
DOMAIN=yourdomain.com
BASE_URL=https://yourdomain.com
IMAGE_BASE_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Session & Security
SESSION_SECRET=your-long-random-secret-here

# Email (Resend)
RESEND_API_KEY=re_your_key_here
RESEND_FROM=assistant@yourdomain.com  # Must verify this domain in Resend!

# AI Services
OPENAI_API_KEY=sk-your-key-here
STABILITY_API_KEY=sk-your-key-here
AI_INTEGRATIONS_GEMINI_API_KEY=your-key-here
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# Cloudflare R2 (for image/media storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=modelai-images
R2_PUBLIC_DOMAIN=images.yourdomain.com  # Optional: subdomain for images

# Code Execution (recommended: false for production)
ENABLE_CODE_EXECUTION=false

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_your_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_key
```

## Step 3: Verify Domain in Resend (IMPORTANT!)

For email verification to work:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides:
   - **TXT record** for domain verification
   - **MX records** (if sending from your domain)
   - **SPF record** (recommended)
   - **DKIM records** (recommended)
5. Wait for verification (usually 5-15 minutes)
6. Update `RESEND_FROM` to use your verified domain:
   ```
   RESEND_FROM=noreply@yourdomain.com
   ```

## Step 4: Update DNS Records (If Not Done)

If your hosting platform requires specific DNS records:

### For Railway:
- Usually just needs nameservers (already done)
- May need CNAME: `www` → `your-service.railway.app`

### For Render:
- CNAME: `www` → `your-service.onrender.com`
- A Record: `@` → Render's IP (if provided)

### For Fly.io:
- A Record: `@` → IP provided by `fly domains list`
- CNAME: `www` → `your-app.fly.dev`

## Step 5: Verify SSL/HTTPS

Most platforms auto-provision SSL certificates:
- **Railway**: Automatic, check in Settings → Networking
- **Render**: Automatic, may take 5-10 minutes
- **Fly.io**: Automatic via Let's Encrypt
- **Vercel**: Automatic

Verify by visiting: `https://yourdomain.com`

## Step 6: Test Your Deployment

After domain is connected:

1. **Test Homepage**: Visit `https://yourdomain.com`
2. **Test Registration**: Create a test account
3. **Test Email Verification**: Check email for verification link
4. **Test Login**: Log in with verified account
5. **Test Features**: 
   - Chat functionality
   - Image generation
   - All other features

## Step 7: Update Application Code (If Needed)

The application should automatically detect your domain through environment variables. However, check:

1. **Email Templates**: Already configured to use `REPLIT_DOMAINS` or `REPLIT_DEV_DOMAIN`
2. **Image URLs**: Uses `IMAGE_BASE_URL` or domain from environment
3. **API Endpoints**: Should work automatically with your domain

## Troubleshooting

### Domain Not Resolving?
- Wait 15-30 minutes for DNS propagation
- Check DNS records with: `nslookup yourdomain.com`
- Verify nameservers are correct at your registrar

### SSL Certificate Not Working?
- Wait 5-10 minutes after domain connection
- Check hosting platform SSL status
- Ensure DNS is fully propagated

### Email Verification Links Wrong?
- Check `REPLIT_DOMAINS` or `REPLIT_DEV_DOMAIN` environment variable
- Verify it's set to your production domain
- Check email template code uses the correct variable

### Images Not Loading?
- Verify `IMAGE_BASE_URL` is set correctly
- Check R2 bucket configuration
- Verify `R2_PUBLIC_DOMAIN` if using custom subdomain

### 404 Errors?
- Ensure your hosting platform is serving the built application
- Check that `npm run build` completed successfully
- Verify static file serving is configured

## Platform-Specific Notes

### Railway
- Domains are added in project settings
- SSL is automatic
- Supports both root domain and www
- Check deployment logs if issues occur

### Render
- Add domain in service settings
- SSL provisioning may take a few minutes
- Supports custom domains and subdomains
- Check service logs for errors

### Fly.io
- Use `fly domains` commands
- SSL via Let's Encrypt (automatic)
- Supports multiple domains per app
- Check logs: `fly logs`

### Vercel
- Add domain in project settings
- SSL is automatic
- Supports preview deployments
- Check deployment logs

## Final Checklist

- [ ] Domain added to hosting platform
- [ ] DNS records configured correctly
- [ ] SSL certificate active (HTTPS working)
- [ ] Environment variables updated with domain
- [ ] Resend domain verified
- [ ] `RESEND_FROM` uses verified domain
- [ ] `REPLIT_DOMAINS` or equivalent set to production domain
- [ ] `IMAGE_BASE_URL` set correctly
- [ ] Test registration and email verification
- [ ] Test all features on production domain
- [ ] Monitor error logs for issues

## Need Help?

If you encounter issues:
1. Check hosting platform logs
2. Verify all environment variables are set
3. Test DNS propagation: `nslookup yourdomain.com`
4. Check SSL status in hosting dashboard
5. Verify Resend domain is verified
6. Review error messages in browser console

