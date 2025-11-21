# API Client Refactoring - Verification Guide

## Quick Answer

**For running the verification script:**
- ✅ **No need to stop servers** - The verification script only reads files from disk
- ✅ **Pull changes first** - You need to get the updated files I created

**For testing the application:**
- ⚠️ **Restart frontend server** - To pick up the new `apiClient` module and environment variables

---

## Step-by-Step Instructions

### Step 1: Pull the Changes

Since I've made changes to your files, you need to pull them. **You're currently on a review branch**, so the changes are in your working directory.

**In your ROOT shell (PowerShell):**

```powershell
# Check current status
git status

# If you see modified files, you can either:
# Option A: Commit the changes (if you want to save them)
git add .
git commit -m "Refactor: Replace hardcoded URLs with centralized API client"

# Option B: If you want to see what changed first
git diff

# Option C: If you want to stash and pull from remote
git stash
git pull origin <your-branch-name>
git stash pop
```

**Note:** Since you're working locally, the changes are already in your working directory. You don't need to pull from remote unless you want to sync with a remote branch.

### Step 2: Run Verification (No Server Needed)

The verification script is a **static analysis tool** that reads files from disk. It doesn't need any servers running.

**In your FRONTEND shell (PowerShell):**

```powershell
# Navigate to frontend directory
cd frontend

# Run the verification script
npm run verify:api-client
```

**Expected Output:**
- ✅ If successful: "All files are using the centralized API client!"
- ❌ If issues found: List of files with hardcoded URLs

### Step 3: Test the Application (Restart Server)

To actually test that the refactoring works, you'll need to restart your frontend server.

**In your FRONTEND shell (PowerShell):**

```powershell
# Stop the current server (Ctrl+C if running)

# Make sure you have the environment variable set
# Check if .env exists
if (Test-Path .env) {
    Get-Content .env | Select-String "VITE_API_BASE_URL"
} else {
    Write-Host "⚠️ .env file not found. Copy from .env.example"
    Copy-Item .env.example .env
}

# Start the server
npm run dev
```

**In your BACKEND shell (PowerShell):**

```powershell
# Make sure backend is running on port 5003
# (Your existing backend setup)
```

### Step 4: Verify Environment Variable

**In your FRONTEND shell (PowerShell):**

```powershell
# Check if VITE_API_BASE_URL is set in .env
Get-Content .env | Select-String "VITE_API_BASE_URL"

# If not set, add it:
# VITE_API_BASE_URL=http://localhost:5003
```

---

## Complete Workflow

### First Time Setup

1. **ROOT shell:**
   ```powershell
   git status  # See what changed
   git diff    # Review changes (optional)
   ```

2. **FRONTEND shell:**
   ```powershell
   cd frontend
   
   # Ensure .env file exists with VITE_API_BASE_URL
   if (-not (Test-Path .env)) {
       Copy-Item .env.example .env
   }
   
   # Add VITE_API_BASE_URL if missing
   $envContent = Get-Content .env -Raw
   if ($envContent -notmatch "VITE_API_BASE_URL") {
       Add-Content .env "`n# Backend API Base URL`nVITE_API_BASE_URL=http://localhost:5003"
   }
   
   # Run verification (no server needed)
   npm run verify:api-client
   ```

3. **FRONTEND shell (restart server):**
   ```powershell
   # Stop current server (Ctrl+C)
   # Start fresh
   npm run dev
   ```

4. **Test in browser:**
   - Open the recruiter dashboard
   - Try various features (job listings, offers, interviews, etc.)
   - Check browser console for any errors
   - Verify API calls are working

---

## Troubleshooting

### Verification Script Fails

**Error: "Cannot find module"**
```powershell
# Make sure you're in the frontend directory
cd frontend
npm install  # Ensure dependencies are installed
```

### API Calls Fail After Refactoring

**Check:**
1. Environment variable is set:
   ```powershell
   Get-Content .env | Select-String "VITE_API_BASE_URL"
   ```

2. Server was restarted after adding env var

3. Backend is running on port 5003

4. Check browser console for errors

### Still See Hardcoded URLs

The verification script will show you exactly which files still have issues. Most remaining instances are in:
- Utility files (acceptable - they're defaults)
- Service files (acceptable - they use env vars)
- Non-recruiter components (outside scope)

---

## Quick Reference

| Task | Stop Server? | Pull First? | Command |
|------|-------------|-------------|---------|
| Run verification | ❌ No | ✅ Yes | `npm run verify:api-client` |
| Test application | ✅ Yes (restart) | ✅ Yes | `npm run dev` |
| Check env vars | ❌ No | ❌ No | `Get-Content .env` |

---

## What Changed

- ✅ Created `frontend/src/utils/apiClient.ts`
- ✅ Updated `.env.example` and `.env.template`
- ✅ Refactored 35+ files to use `apiClient`
- ✅ Updated test files
- ✅ Created verification script

All changes are in your working directory. You can review them with `git diff` before committing.
