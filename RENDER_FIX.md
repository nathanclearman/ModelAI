# Fix Render Build Error

## The Problem

Render is failing with:
```
sh: 1: vite: not found
```

This happens because `vite` is in `devDependencies`, and when `NODE_ENV=production`, npm might skip dev dependencies during install.

## The Fix

### Option 1: Update Build Command in Render (Recommended)

In Render Dashboard → Your Service → Settings → Build Command, change it to:

```
npm ci && npm run build
```

Or:

```
npm install --include=dev && npm run build
```

### Option 2: Move vite to dependencies (Alternative)

If Option 1 doesn't work, we can move `vite` and other build tools to `dependencies` instead of `devDependencies`.

## Updated Build Command for Render

**Change your Render build command to:**

```
npm ci && npm run build
```

**Or:**

```
npm install --include=dev && npm run build
```

**Or (most reliable):**

```
npm install && npm run build
```

## Steps to Fix

1. **Go to Render Dashboard**
2. **Click on your service**
3. **Go to Settings**
4. **Find "Build Command"**
5. **Change it to:** `npm install && npm run build`
6. **Save changes**
7. **Trigger a new deployment** (or it will auto-deploy)

## Why This Works

- `npm install` installs ALL dependencies (including devDependencies)
- `npm ci` is faster but requires exact lockfile match
- `npm install --include=dev` explicitly includes dev dependencies
- All of these will install `vite` which is needed for the build

## After Fixing

The build should now:
1. ✅ Install all dependencies (including vite)
2. ✅ Run `vite build` successfully
3. ✅ Run `esbuild` to bundle the server
4. ✅ Complete successfully

Try updating the build command in Render and redeploy!

