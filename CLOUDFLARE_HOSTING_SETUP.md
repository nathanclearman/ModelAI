# Hosting ModelAI on Cloudflare

## Understanding Cloudflare Hosting Options

Cloudflare offers several hosting options:
1. **Cloudflare Pages** - For static sites and serverless functions
2. **Cloudflare Workers** - For serverless functions
3. **Cloudflare Tunnel (Cloudflared)** - To connect your local/external server through Cloudflare

Since ModelAI is a Node.js app with a backend, you have a few options:

## Option 1: Cloudflare Pages + Workers (Recommended for Node.js Apps)

Cloudflare Pages can host static frontends, and Workers can handle API routes.

### Step 1: Deploy Frontend to Cloudflare Pages

1. **Build your frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Go to Cloudflare Dashboard** → **Pages**
3. **Create a new project**
4. **Connect your GitHub repository** (or upload files)
5. **Build settings:**
   - Build command: `cd client && npm install && npm run build`
   - Build output directory: `client/dist`
   - Root directory: `/`

### Step 2: Deploy Backend to Cloudflare Workers

**Note:** Cloudflare Workers has limitations (no file system, limited Node.js APIs). You may need to adapt your backend.

**Alternative:** Use Cloudflare Tunnel (see Option 2 below)

## Option 2: Cloudflare Tunnel (Cloudflared) - Best for Full Node.js Apps

This allows you to run your Node.js app anywhere and connect it through Cloudflare.

### Step 1: Deploy Your App to a Server

You can deploy to:
- **Railway** (easiest)
- **Render**
- **Fly.io**
- **Any VPS** (DigitalOcean, Linode, etc.)
- **Even your local machine** (for testing)

### Step 2: Set Up Cloudflare Tunnel

1. **Install Cloudflared:**
   ```bash
   # On Windows (PowerShell as Admin)
   winget install --id Cloudflare.cloudflared
   
   # Or download from: https://github.com/cloudflare/cloudflared/releases
   ```

2. **Authenticate:**
   ```bash
   cloudflared tunnel login
   ```
   - This opens a browser to authorize

3. **Create a tunnel:**
   ```bash
   cloudflared tunnel create modelai
   ```

4. **Configure the tunnel:**
   Create `config.yml` in `%USERPROFILE%\.cloudflared\`:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: %USERPROFILE%\.cloudflared\<tunnel-id>.json
   
   ingress:
     - hostname: modelai.info
       service: http://localhost:5000
     - hostname: www.modelai.info
       service: http://localhost:5000
     - service: http_status:404
   ```

5. **Route DNS:**
   ```bash
   cloudflared tunnel route dns modelai modelai.info
   cloudflared tunnel route dns modelai www.modelai.info
   ```

6. **Run the tunnel:**
   ```bash
   cloudflared tunnel run modelai
   ```

### Step 3: Run Your App

1. **Start your ModelAI app:**
   ```bash
   npm start
   # Or use your start script
   ```

2. **Keep Cloudflared running** (or set it up as a service)

## Option 3: Deploy to Railway/Render + Use Cloudflare DNS

This is the **easiest** option:

### Step 1: Deploy to Railway or Render

1. **Deploy your app to Railway or Render** (see `DEPLOYMENT.md`)
2. **Get your app URL:** `https://your-app.railway.app` or `https://your-app.onrender.com`

### Step 2: Configure Cloudflare DNS

1. **Go to Cloudflare Dashboard** → **DNS** → **Records**
2. **Add CNAME record:**
   ```
   Type: CNAME
   Name: @
   Target: your-app.railway.app (or your-app.onrender.com)
   Proxy: Proxied (orange cloud) ✅
   ```

3. **Add www subdomain (optional):**
   ```
   Type: CNAME
   Name: www
   Target: your-app.railway.app
   Proxy: Proxied (orange cloud) ✅
   ```

### Step 3: Configure SSL

1. **Cloudflare Dashboard** → **SSL/TLS** → **Overview**
2. **Set to "Full"** (Railway/Render have SSL)
3. **Wait 5-10 minutes** for SSL to provision

## Option 4: Cloudflare Pages with Functions (For Static + API)

If you want to use Cloudflare Pages:

1. **Deploy frontend to Pages** (as in Option 1)
2. **Convert API routes to Cloudflare Functions:**
   - Create `functions/` directory in your Pages project
   - Convert Express routes to Cloudflare Functions format
   - This requires significant code changes

## Recommended: Option 3 (Railway/Render + Cloudflare DNS)

**Why this is best:**
- ✅ No code changes needed
- ✅ Full Node.js support
- ✅ Easy deployment
- ✅ Automatic SSL
- ✅ Just use Cloudflare for DNS/CDN

## Quick Setup (Railway + Cloudflare)

### 1. Deploy to Railway:

1. **Push code to GitHub**
2. **Go to [railway.app](https://railway.app)**
3. **New Project** → **Deploy from GitHub**
4. **Select your ModelAI repository**
5. **Add environment variables** (all your R2, database, API keys)
6. **Railway will deploy and give you a URL:** `https://your-app.railway.app`

### 2. Connect to Cloudflare:

1. **Cloudflare Dashboard** → **DNS** → **Records**
2. **Add CNAME:**
   ```
   Type: CNAME
   Name: @
   Target: your-app.railway.app
   Proxy: Proxied ✅
   ```
3. **SSL/TLS** → **Overview** → Set to **"Full"**
4. **Wait 5-10 minutes**

### 3. Done!

Your site should work at `https://modelai.info`

## Current Issue: Error 525

**Why you're getting Error 525:**
- Cloudflare is trying to connect to an origin server
- But there's no origin server configured
- Or the origin server isn't accessible

**To fix:**
1. **Deploy your app somewhere** (Railway, Render, etc.)
2. **Point Cloudflare DNS to that deployment**
3. **Set SSL mode to "Full"**

## Which Option Should You Use?

**For easiest setup:** Use **Railway + Cloudflare DNS** (Option 3)
- Deploy to Railway (5 minutes)
- Point Cloudflare DNS to Railway URL
- Done!

**For full control:** Use **Cloudflare Tunnel** (Option 2)
- Run app on any server
- Connect through Cloudflare Tunnel
- More setup, but flexible

**For static site:** Use **Cloudflare Pages** (Option 1)
- Requires converting backend to Workers/Functions
- More work, but fully on Cloudflare

## Next Steps

1. **Choose your hosting option** (I recommend Railway)
2. **Deploy your app** to that platform
3. **Point Cloudflare DNS** to your deployment
4. **Set SSL mode** to "Full"
5. **Test** `https://modelai.info`

Need help with a specific option? Let me know which one you want to use!

