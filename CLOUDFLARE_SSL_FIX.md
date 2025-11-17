# Fixing Cloudflare SSL Error 525

## What Error 525 Means

Error 525 means Cloudflare can't establish an SSL connection to your origin server (where your app is actually hosted). This happens when:

1. Your origin server doesn't have SSL/HTTPS
2. Cloudflare SSL mode is incompatible
3. Origin server isn't accessible
4. SSL certificate issues

## Solution Steps

### Step 1: Determine Your Hosting Platform

**Where is your ModelAI app actually running?**

- **Railway?** → Your app URL looks like: `https://your-app.railway.app`
- **Render?** → Your app URL looks like: `https://your-app.onrender.com`
- **Fly.io?** → Your app URL looks like: `https://your-app.fly.dev`
- **Vercel?** → Your app URL looks like: `https://your-app.vercel.app`
- **Self-hosted?** → Your own server IP/domain

### Step 2: Configure Cloudflare SSL Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `modelai.info`
3. Go to **SSL/TLS** → **Overview**
4. Set SSL/TLS encryption mode to **"Flexible"** (temporary fix)

   **Why Flexible?**
   - Flexible: Cloudflare ↔ Visitor = HTTPS, Cloudflare ↔ Origin = HTTP
   - This works if your origin server doesn't have SSL yet
   - **Note:** This is less secure, but works for most hosting platforms

5. If your origin server HAS SSL, use **"Full"** or **"Full (strict)"**

### Step 3: Configure DNS Records

1. Go to **DNS** → **Records**
2. Make sure you have the correct record pointing to your origin:

   **If using Railway/Render/Fly.io:**
   ```
   Type: CNAME
   Name: @ (or www)
   Target: your-app.railway.app (or your actual app URL)
   Proxy: Proxied (orange cloud) ✅
   ```

   **If using a VPS/Server:**
   ```
   Type: A
   Name: @
   Target: YOUR_SERVER_IP
   Proxy: Proxied (orange cloud) ✅
   ```

### Step 4: Verify Origin Server

**Test if your origin server is accessible:**

1. **Temporarily disable Cloudflare proxy** (gray cloud the DNS record)
2. Try accessing your origin directly: `http://your-app.railway.app` (or your origin URL)
3. If it works, the issue is SSL configuration
4. Re-enable proxy (orange cloud)

### Step 5: Platform-Specific Fixes

#### If Using Railway:

1. Railway provides HTTPS automatically
2. In Cloudflare, set SSL mode to **"Full"**
3. Make sure DNS CNAME points to: `your-app.railway.app`
4. Railway's SSL should work with Cloudflare

#### If Using Render:

1. Render provides HTTPS automatically
2. In Cloudflare, set SSL mode to **"Full"**
3. Make sure DNS CNAME points to: `your-app.onrender.com`
4. Render's SSL should work with Cloudflare

#### If Using Fly.io:

1. Fly.io provides HTTPS automatically
2. In Cloudflare, set SSL mode to **"Full"**
3. Make sure DNS CNAME points to: `your-app.fly.dev`
4. Fly.io's SSL should work with Cloudflare

#### If Using Vercel:

1. Vercel provides HTTPS automatically
2. In Cloudflare, set SSL mode to **"Full"**
3. Add domain in Vercel dashboard first
4. Then point Cloudflare DNS to Vercel

#### If Self-Hosting:

1. You need SSL on your server (Let's Encrypt recommended)
2. In Cloudflare, set SSL mode to **"Full"** or **"Full (strict)"**
3. Make sure your server has valid SSL certificate

### Step 6: Wait for Propagation

After making changes:
- Wait 1-5 minutes for DNS/SSL changes to propagate
- Clear browser cache or try incognito mode
- Test again

## Quick Fix (Temporary)

**If you need it working NOW:**

1. Cloudflare Dashboard → SSL/TLS → Overview
2. Set to **"Flexible"**
3. Wait 1-2 minutes
4. Try accessing `https://modelai.info` again

**⚠️ Warning:** Flexible mode is less secure. Upgrade to "Full" once your origin has SSL.

## Troubleshooting Checklist

- [ ] SSL/TLS mode set correctly (Flexible for HTTP origin, Full for HTTPS origin)
- [ ] DNS record points to correct origin server
- [ ] DNS record is "Proxied" (orange cloud)
- [ ] Origin server is accessible (test without Cloudflare proxy)
- [ ] Origin server has SSL if using "Full" mode
- [ ] Waited 5+ minutes for changes to propagate
- [ ] Cleared browser cache

## Still Not Working?

### Check Cloudflare Logs:

1. Go to Cloudflare Dashboard → Analytics → Logs
2. Look for error details
3. Check what origin Cloudflare is trying to reach

### Test Origin Directly:

1. Temporarily disable Cloudflare proxy (gray cloud)
2. Access your origin: `http://your-origin-url`
3. If it works, the issue is SSL configuration
4. If it doesn't work, the issue is with your hosting

### Common Issues:

**Issue:** "Origin server not responding"
- **Fix:** Check if your app is actually running and accessible

**Issue:** "SSL certificate invalid"
- **Fix:** Use "Flexible" mode, or fix SSL on origin server

**Issue:** "Connection timeout"
- **Fix:** Check firewall, make sure origin server allows Cloudflare IPs

## Need More Help?

1. **What hosting platform are you using?** (Railway, Render, Fly.io, etc.)
2. **What's your origin server URL?** (the actual app URL)
3. **What SSL mode is currently set in Cloudflare?**
4. **Can you access your origin directly?** (without Cloudflare)

Share these details and I can provide specific instructions!

