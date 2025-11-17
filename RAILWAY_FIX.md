# Railway Build Error Fix

## The Problem

Railway's Nixpacks is having trouble with the `nixpacks.toml` configuration. The error shows:
```
error: undefined variable 'nodejs-20_x'
```

## The Solution

I've removed the problematic `nixpacks.toml` file. Railway should auto-detect Node.js from your `package.json` file.

## What I Changed

1. ✅ **Removed `nixpacks.toml`** - Railway will auto-detect Node.js
2. ✅ **Simplified `railway.json`** - Removed explicit build command (Railway will use package.json scripts)

## Next Steps

1. **Commit and push the changes:**
   ```bash
   git add railway.json
   git commit -m "Fix Railway build configuration"
   git push
   ```

2. **Or manually set in Railway Dashboard:**
   - Go to Railway → Your Service → Settings
   - **Build Command:** Leave empty (Railway will auto-detect)
   - **Start Command:** `npm start`
   - **Root Directory:** Leave empty (or `./`)

3. **Railway should now:**
   - Auto-detect Node.js from `package.json`
   - Run `npm install` automatically
   - Run `npm run build` (from your package.json)
   - Run `npm start` to start the app

## Verify Your package.json

Make sure your `package.json` has these scripts (it does!):
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "node dist/index.js"
  }
}
```

## If It Still Fails

Try setting these manually in Railway Settings:

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Node Version:**
Set environment variable: `NODE_VERSION=20`

## Redeploy

After pushing changes, Railway should automatically redeploy. If not:
1. Go to Railway → Deployments
2. Click "Redeploy" or trigger a new deployment

The build should now work! 🚀

