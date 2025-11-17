# How to Commit and Push to GitHub

## Method 1: Using Git Command Line (If Installed)

### Step 1: Check if Git is Installed

Open PowerShell and run:
```powershell
git --version
```

If you see a version number, Git is installed! If you get an error, see Method 2 below.

### Step 2: Navigate to Your Project

```powershell
cd "$env:USERPROFILE\Downloads\ModelAI\ModelAI"
```

### Step 3: Check Status

```powershell
git status
```

This shows what files have changed.

### Step 4: Add Files

```powershell
# Add all changed files
git add .

# Or add specific files
git add railway.json package.json .nvmrc
```

### Step 5: Commit

```powershell
git commit -m "Fix Railway build configuration"
```

### Step 6: Push to GitHub

```powershell
# If you haven't set up a remote yet:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Then push:
git push -u origin main
```

## Method 2: Install Git First (If Not Installed)

### Option A: Install Git for Windows

1. **Download Git:**
   - Go to: https://git-scm.com/download/win
   - Download and install with default settings

2. **Restart PowerShell** after installation

3. **Then follow Method 1 above**

### Option B: Use GitHub Desktop (Easier!)

1. **Download GitHub Desktop:**
   - Go to: https://desktop.github.com
   - Download and install

2. **Sign in with your GitHub account**

3. **Add your repository:**
   - File → Add Local Repository
   - Browse to: `C:\Users\coleo\Downloads\ModelAI\ModelAI`
   - Click "Add repository"

4. **Commit and push:**
   - You'll see all your changed files
   - Write a commit message: "Fix Railway build configuration"
   - Click "Commit to main"
   - Click "Push origin" (or "Publish repository" if first time)

## Method 3: Quick PowerShell Commands

If Git is installed, here are the exact commands:

```powershell
# Navigate to project
cd "$env:USERPROFILE\Downloads\ModelAI\ModelAI"

# Check what changed
git status

# Add all changes
git add .

# Commit
git commit -m "Fix Railway build configuration and add Railway deployment files"

# If you have a GitHub remote set up:
git push

# If you need to add GitHub remote first:
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
# git push -u origin main
```

## Method 4: Upload Directly to GitHub (No Git Needed)

If you can't install Git:

1. **Go to your GitHub repository** (create one if needed)
2. **Click "uploading an existing file"**
3. **Drag and drop these files:**
   - `railway.json`
   - `package.json` (updated)
   - `.nvmrc`
   - All other project files (except `node_modules` and `dist`)
4. **Click "Commit changes"**

**Note:** This is less ideal - you'll need to upload manually each time.

## Check if You Have a GitHub Remote

To see if your repo is connected to GitHub:

```powershell
cd "$env:USERPROFILE\Downloads\ModelAI\ModelAI"
git remote -v
```

If you see a GitHub URL, you're connected! If not, you need to add one (see Step 6 in Method 1).

## Quick Checklist

- [ ] Git installed? (Check with `git --version`)
- [ ] GitHub account created?
- [ ] GitHub repository created?
- [ ] Local repo connected to GitHub? (Check with `git remote -v`)
- [ ] Files added (`git add .`)
- [ ] Files committed (`git commit -m "message"`)
- [ ] Files pushed (`git push`)

## Need Help?

**If Git is not installed:**
- Install from: https://git-scm.com/download/win
- Or use GitHub Desktop: https://desktop.github.com

**If you don't have a GitHub account:**
- Create one at: https://github.com/signup

**If you don't have a GitHub repository:**
- Go to GitHub.com → Click "+" → New repository
- Don't initialize with README
- Copy the repository URL
- Add it as remote: `git remote add origin YOUR_REPO_URL`

Let me know which step you're on and I can help!

