# Connect Railway to Cloudflare - Quick Guide

Your Railway URL: `n9nevsjz.up.railway.app`

## Step 1: Add Custom Domain in Railway

1. **Go to Railway Dashboard** → Your Service → **Settings**
2. **Scroll to "Networking" or "Domains" section**
3. **Click "Generate Domain"** or **"Add Custom Domain"**
4. **Enter:** `modelai.info` (or `www.modelai.info` if you prefer subdomain)
5. **Railway will verify the domain** - you'll need to add a DNS record

## Step 2: Configure Cloudflare DNS

1. **Go to [Cloudflare Dashboard](https://dash.cloudflare.com)**
2. **Select domain:** `modelai.info`
3. **Go to "DNS" → "Records"**

### Add CNAME Record:

**Option A: Root Domain (modelai.info)**
- **Type:** `CNAME`
- **Name:** `@` (or leave blank)
- **Target:** `n9nevsjz.up.railway.app`
- **Proxy status:** 🟠 **Proxied** (orange cloud) - **IMPORTANT!**
- **TTL:** Auto
- **Save**

**Option B: Subdomain (www.modelai.info)**
- **Type:** `CNAME`
- **Name:** `www`
- **Target:** `n9nevsjz.up.railway.app`
- **Proxy status:** 🟠 **Proxied** (orange cloud)
- **TTL:** Auto
- **Save**

**Note:** If CNAME on root domain doesn't work, Railway might provide a different target. Check Railway's domain settings after adding the custom domain.

## Step 3: Configure Cloudflare SSL

1. **Cloudflare Dashboard** → Your Domain → **SSL/TLS**
2. **Set encryption mode to:** `Full` or `Full (strict)`
   - **Full:** Works with Railway's SSL
   - **Full (strict):** Requires valid certificate (use if Railway provides one)
3. **Save**

## Step 4: Update Railway Environment Variables

Make sure these are set in Railway (Variables tab):

```
DOMAIN=modelai.info
BASE_URL=https://modelai.info
IMAGE_BASE_URL=https://modelai.info
```

Or if using subdomain:
```
DOMAIN=www.modelai.info
BASE_URL=https://www.modelai.info
IMAGE_BASE_URL=https://www.modelai.info
```

## Step 5: Wait for DNS Propagation

- **Wait 5-60 minutes** for DNS to propagate
- Check status: https://dnschecker.org
- Enter `modelai.info` and check if it resolves

## Step 6: Verify It's Working

1. **Visit:** `https://modelai.info`
2. **Check SSL:** Should show valid certificate
3. **Test the site:** Make sure everything loads

## Troubleshooting

### SSL Error 525

**Problem:** Cloudflare can't connect to Railway

**Solution:**
1. Check Cloudflare SSL/TLS mode is set to **"Full"** (not "Flexible")
2. Verify Railway domain is active in Railway settings
3. Wait a few minutes for SSL to provision

### DNS Not Resolving

**Problem:** Domain doesn't point to Railway

**Solution:**
1. Verify CNAME record in Cloudflare:
   - Should point to `n9nevsjz.up.railway.app`
   - Should be **Proxied** (orange cloud)
2. Check Railway domain status:
   - Railway → Settings → Domains
   - Should show domain as "Active" or "Verified"
3. Clear DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   ```

### Site Shows Railway Default Page

**Problem:** Railway isn't routing correctly

**Solution:**
1. Make sure custom domain is added in Railway
2. Check Railway service is running (check deployments)
3. Verify environment variables are set correctly

## Quick Checklist

- [ ] Added custom domain in Railway (`modelai.info`)
- [ ] Added CNAME record in Cloudflare pointing to `n9nevsjz.up.railway.app`
- [ ] Set Cloudflare proxy to 🟠 **Proxied** (orange cloud)
- [ ] Set Cloudflare SSL/TLS to **"Full"**
- [ ] Added `DOMAIN` and `BASE_URL` environment variables in Railway
- [ ] Waited 5-60 minutes for DNS propagation
- [ ] Tested site at `https://modelai.info`

## After Setup

Your site will be accessible at:
- **Primary:** `https://modelai.info`
- **Railway direct:** `https://n9nevsjz.up.railway.app` (will still work)

All traffic flows:
**User → Cloudflare (CDN/SSL) → Railway (Your App)**

Benefits:
- ✅ Free SSL certificate
- ✅ DDoS protection
- ✅ CDN caching
- ✅ Fast global delivery
- ✅ Custom domain

