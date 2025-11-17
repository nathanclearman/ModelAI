# Connect Railway to Cloudflare

## Step 1: Get Your Railway URL

1. **Go to Railway Dashboard** → Your Service
2. **Click on "Settings"** tab
3. **Find "Domains"** section
4. **Copy your Railway URL** (it will look like: `your-app-name.up.railway.app`)

Or check the **"Deployments"** tab - your live URL is shown there.

## Step 2: Configure Cloudflare DNS

1. **Go to [Cloudflare Dashboard](https://dash.cloudflare.com)**
2. **Select your domain** (`modelai.info`)
3. **Go to "DNS" → "Records"**
4. **Add/Edit DNS Records:**

### Option A: Root Domain (modelai.info)

**Add a CNAME record:**
- **Type:** `CNAME`
- **Name:** `@` (or leave blank for root domain)
- **Target:** `your-app-name.up.railway.app` (your Railway URL)
- **Proxy status:** 🟠 Proxied (orange cloud)
- **TTL:** Auto

**Note:** Some DNS providers don't allow CNAME on root domain. If that's the case, use Option B.

### Option B: Use A Record (if CNAME doesn't work)

1. **Get Railway's IP address:**
   - Railway uses dynamic IPs, so you'll need to use their domain
   - Or contact Railway support for a static IP

2. **Add A record:**
   - **Type:** `A`
   - **Name:** `@`
   - **IPv4 address:** (Railway's IP - check Railway docs)
   - **Proxy status:** 🟠 Proxied
   - **TTL:** Auto

**Recommended:** Use CNAME with `@` if your DNS provider supports it, otherwise use a subdomain.

### Option C: Use Subdomain (Easiest)

**Add a CNAME record:**
- **Type:** `CNAME`
- **Name:** `www` (or `app`, `api`, etc.)
- **Target:** `your-app-name.up.railway.app`
- **Proxy status:** 🟠 Proxied (orange cloud)
- **TTL:** Auto

Then access your site at `www.modelai.info`

## Step 3: Configure Railway Custom Domain

1. **In Railway Dashboard** → Your Service → **Settings**
2. **Scroll to "Domains"** section
3. **Click "Generate Domain"** or **"Add Custom Domain"**
4. **Enter your domain:** `modelai.info` (or `www.modelai.info` if using subdomain)
5. **Railway will provide DNS instructions** - follow them

**Important:** Railway will give you a CNAME target. Use that in Cloudflare instead of the `.up.railway.app` URL.

## Step 4: Configure Cloudflare SSL

1. **Go to Cloudflare Dashboard** → Your Domain → **SSL/TLS**
2. **Set encryption mode to:** `Full` or `Full (strict)`
   - **Full:** Allows self-signed certificates
   - **Full (strict):** Requires valid SSL certificate (recommended if Railway provides one)
3. **Save**

## Step 5: Update Environment Variables

In Railway, set these environment variables:

1. **Go to Railway Dashboard** → Your Service → **Variables**
2. **Add/Update:**

```
DOMAIN=modelai.info
BASE_URL=https://modelai.info
```

Or if using subdomain:
```
DOMAIN=www.modelai.info
BASE_URL=https://www.modelai.info
```

## Step 6: Wait for DNS Propagation

- DNS changes can take **5-60 minutes** to propagate
- Check status at: https://dnschecker.org
- Enter your domain and check if it points to Railway

## Step 7: Verify It's Working

1. **Visit your domain:** `https://modelai.info`
2. **Check SSL:** Should show a valid certificate
3. **Test the site:** Make sure everything loads correctly

## Troubleshooting

### SSL Handshake Error (525)

**Problem:** Cloudflare can't establish SSL connection to Railway

**Solution:**
1. **Check Cloudflare SSL/TLS mode:**
   - Go to **SSL/TLS** → **Overview**
   - Set to **"Full"** (not "Flexible")
   
2. **Check Railway SSL:**
   - Railway should automatically provision SSL
   - Check Railway dashboard for SSL status

3. **Wait a few minutes** for SSL to provision

### DNS Not Resolving

**Problem:** Domain doesn't point to Railway

**Solution:**
1. **Verify DNS records in Cloudflare:**
   - Check the CNAME/A record is correct
   - Make sure it's **Proxied** (orange cloud)

2. **Check Railway domain:**
   - Railway should show your custom domain as "Active"
   - If not, add it in Railway settings

3. **Clear DNS cache:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   ```

### Site Shows Railway Default Page

**Problem:** Railway isn't routing to your app

**Solution:**
1. **Check Railway service:**
   - Make sure your service is deployed and running
   - Check logs for errors

2. **Verify domain in Railway:**
   - Railway → Settings → Domains
   - Make sure your domain is listed and active

## Quick Checklist

- [ ] Got Railway URL from Railway dashboard
- [ ] Added CNAME/A record in Cloudflare DNS
- [ ] Set Cloudflare proxy to 🟠 Proxied (orange cloud)
- [ ] Added custom domain in Railway settings
- [ ] Set Cloudflare SSL/TLS to "Full"
- [ ] Added DOMAIN and BASE_URL environment variables in Railway
- [ ] Waited 5-60 minutes for DNS propagation
- [ ] Tested site at your domain

## After Setup

Once connected, your site will be accessible at:
- `https://modelai.info` (or your subdomain)

All traffic will flow:
**User → Cloudflare (CDN/SSL) → Railway (Your App)**

This gives you:
- ✅ Free SSL certificate
- ✅ DDoS protection
- ✅ CDN caching
- ✅ Fast global delivery

