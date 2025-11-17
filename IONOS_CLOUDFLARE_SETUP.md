# Ionos + Cloudflare Setup Guide

## Fixing SSL Error 525 with Ionos Hosting

Since you're using Ionos, here's how to fix the Cloudflare SSL error:

## Step 1: Get Your Ionos Server IP

1. Log into your **Ionos account**
2. Go to your hosting/server settings
3. Find your **server IP address** (looks like: `123.45.67.89`)
4. **Note this IP** - you'll need it for DNS

## Step 2: Configure Cloudflare DNS

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select domain: `modelai.info`
3. Go to **DNS** → **Records**

4. **Add/Update A Record:**
   ```
   Type: A
   Name: @
   IPv4 address: YOUR_IONOS_IP (e.g., 123.45.67.89)
   Proxy status: Proxied (orange cloud) ✅
   TTL: Auto
   ```

5. **Optional - Add www subdomain:**
   ```
   Type: A
   Name: www
   IPv4 address: YOUR_IONOS_IP (same IP)
   Proxy status: Proxied (orange cloud) ✅
   TTL: Auto
   ```

## Step 3: Configure Cloudflare SSL Mode

**Option A: If Ionos has SSL/HTTPS enabled**

1. Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. Set encryption mode to **"Full"**
3. This allows Cloudflare to connect via HTTPS to your Ionos server

**Option B: If Ionos only has HTTP (no SSL)**

1. Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. Set encryption mode to **"Flexible"**
3. This allows Cloudflare to connect via HTTP to your Ionos server
4. ⚠️ **Note:** Less secure, but works if Ionos doesn't have SSL

## Step 4: Enable SSL on Ionos (Recommended)

If your Ionos hosting doesn't have SSL yet, you should enable it:

### For Ionos Shared Hosting:

1. Log into **Ionos Control Panel**
2. Go to **SSL Certificates** or **Security**
3. Enable **Let's Encrypt SSL** (usually free)
4. Wait for certificate to be issued (5-15 minutes)
5. Once SSL is active, change Cloudflare SSL mode to **"Full"**

### For Ionos VPS/Dedicated Server:

1. **Install Certbot** (Let's Encrypt):
   ```bash
   # SSH into your server
   sudo apt update
   sudo apt install certbot
   ```

2. **Get SSL Certificate:**
   ```bash
   sudo certbot certonly --standalone -d modelai.info -d www.modelai.info
   ```

3. **Configure your web server** (Nginx/Apache) to use the certificate

4. Once SSL is working, change Cloudflare SSL mode to **"Full"**

## Step 5: Configure Your App on Ionos

### If Using Ionos Shared Hosting:

1. Upload your built application files
2. Make sure Node.js is enabled (if using Node.js hosting)
3. Set environment variables in Ionos control panel
4. Point your domain to the correct directory

### If Using Ionos VPS:

1. **SSH into your server**
2. **Install Node.js** (if not already installed):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone/Upload your app:**
   ```bash
   cd /var/www
   git clone YOUR_REPO_URL ModelAI
   cd ModelAI
   npm install
   npm run build
   ```

4. **Set up PM2** (process manager):
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "modelai" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** (reverse proxy):
   ```nginx
   server {
       listen 80;
       server_name modelai.info www.modelai.info;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable SSL with Certbot:**
   ```bash
   sudo certbot --nginx -d modelai.info -d www.modelai.info
   ```

## Step 6: Set Environment Variables on Ionos

Make sure these are set in your Ionos hosting environment:

```bash
NODE_ENV=production
PORT=5000
DOMAIN=modelai.info
BASE_URL=https://modelai.info
IMAGE_BASE_URL=https://modelai.info

# Database
DATABASE_URL=your_database_url

# Session
SESSION_SECRET=your_secret_here

# Email
RESEND_API_KEY=your_key
RESEND_FROM=assistant@modelai.info

# AI Services
OPENAI_API_KEY=your_key
STABILITY_API_KEY=your_key
AI_INTEGRATIONS_GEMINI_API_KEY=your_key

# Cloudflare R2
R2_ACCOUNT_ID=ba4351dab80e771fd255ee03454a83a2
R2_ACCESS_KEY_ID=38dbfb4b8848ae2aed739214d63fe303
R2_SECRET_ACCESS_KEY=8776e0e44fe716951bb0ac45350a0776223caf1f3ef153527ae36ea915b4a59a
R2_BUCKET_NAME=modelai-images

# Code Execution
ENABLE_CODE_EXECUTION=false
```

## Step 7: Test the Connection

1. **Wait 5-10 minutes** for DNS/SSL changes to propagate
2. **Test origin directly** (temporarily disable Cloudflare proxy):
   - Access: `http://YOUR_IONOS_IP` or `https://modelai.info` (if SSL enabled)
   - Should see your app
3. **Re-enable Cloudflare proxy** (orange cloud)
4. **Test through Cloudflare**: `https://modelai.info`

## Troubleshooting

### Still Getting Error 525?

1. **Check if your app is running:**
   - SSH into Ionos server
   - Check if Node.js process is running: `pm2 list` or `ps aux | grep node`
   - Check if port 5000 is listening: `netstat -tulpn | grep 5000`

2. **Check firewall:**
   - Make sure port 80/443 is open on Ionos
   - Make sure port 5000 is accessible (if using reverse proxy)

3. **Test origin without Cloudflare:**
   - Temporarily gray cloud (disable proxy) the DNS record
   - Access directly: `http://YOUR_IONOS_IP:5000` or `https://modelai.info`
   - If it works, issue is Cloudflare SSL configuration
   - If it doesn't work, issue is with Ionos/server setup

4. **Check Cloudflare SSL mode:**
   - Should be "Flexible" if no SSL on origin
   - Should be "Full" if SSL is enabled on origin

### Common Issues:

**Issue:** "Connection refused"
- **Fix:** App not running on Ionos, or wrong port

**Issue:** "SSL handshake failed"
- **Fix:** Change Cloudflare SSL mode to "Flexible" (if no SSL on origin)

**Issue:** "502 Bad Gateway"
- **Fix:** App crashed or not listening on correct port

## Quick Checklist

- [ ] Ionos server IP address noted
- [ ] Cloudflare DNS A record points to Ionos IP (Proxied)
- [ ] Cloudflare SSL mode set (Flexible for HTTP, Full for HTTPS)
- [ ] App is running on Ionos server
- [ ] Environment variables set on Ionos
- [ ] Port 5000 accessible (or reverse proxy configured)
- [ ] SSL enabled on Ionos (recommended)
- [ ] Tested origin directly (without Cloudflare)
- [ ] Tested through Cloudflare

## Need More Help?

Share these details:
1. **Ionos hosting type:** Shared hosting, VPS, or dedicated server?
2. **Server IP address:** What's your Ionos server IP?
3. **Current Cloudflare SSL mode:** What's it set to now?
4. **Can you access your app directly?** (without Cloudflare)
5. **Is SSL enabled on Ionos?** (HTTPS working directly?)

With these details, I can provide more specific instructions!

