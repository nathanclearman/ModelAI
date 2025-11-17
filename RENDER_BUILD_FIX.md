# Fix Render Build Error - vite not found

## The Problem

Render build is failing with:
```
sh: 1: vite: not found
```

This happens because `vite` is in `devDependencies`, and Render might skip dev dependencies during install.

## The Fix

### Update Build Command in Render

1. **Go to Render Dashboard**
2. **Click on your service**
3. **Go to Settings**
4. **Find "Build Command"**
5. **Change it to:**
   ```
   npm install && npm run build
   ```
6. **Save changes**
7. **Render will auto-redeploy**

## Why This Works

- `npm install` installs ALL dependencies (including devDependencies)
- This ensures `vite` and `esbuild` are available for the build
- Your current command `npm install; npm run build` should work, but the semicolon might be causing issues

## Alternative Build Commands

If the above doesn't work, try one of these:

**Option 1:**
```
npm ci --include=dev && npm run build
```

**Option 2:**
```
NODE_ENV=development npm install && npm run build
```

**Option 3 (Most Reliable):**
```
npm install --production=false && npm run build
```

## Current vs Fixed

**Current (not working):**
```
npm install; npm run build
```

**Fixed (should work):**
```
npm install && npm run build
```

The difference: `&&` ensures the second command only runs if the first succeeds, and it's more reliable than `;` in some environments.

## After Fixing

The build should:
1. ✅ Install all dependencies (including vite, esbuild)
2. ✅ Run `vite build` successfully
3. ✅ Run `esbuild` to bundle server
4. ✅ Complete successfully

## Quick Steps

1. Render Dashboard → Your Service → Settings
2. Build Command → Change to: `npm install && npm run build`
3. Save
4. Wait for redeploy (or manually trigger)

That's it! The build should work now.

