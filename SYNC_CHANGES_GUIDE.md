# How to Sync the API Client Refactoring Changes

## Current Situation

✅ **Changes are in the workspace** (where I made them)  
❌ **Changes are NOT in your local repo yet** (that's why the script is missing)

## Important: DO NOT Pull Yet!

**Don't run `git pull`** because:
- The changes I made are in this workspace, not in your remote git repo
- Pulling would try to get changes from `origin`, which doesn't have my changes yet
- You need to get the changes FROM the workspace TO your local repo first

## Option 1: Check if Workspace is Your Local Repo (Recommended)

If you're working directly in the workspace directory, the changes are already there! Just check:

**In your FRONTEND shell (PowerShell):**

```powershell
# Check if the verification script exists
Test-Path frontend\scripts\verify-api-client-refactor.js

# Check if apiClient exists
Test-Path frontend\src\utils\apiClient.ts

# Check package.json for the script
Select-String -Path frontend\package.json -Pattern "verify:api-client"
```

If these return `True`, the changes are already there! You just need to:
1. Make sure `.env` has `VITE_API_BASE_URL`
2. Run the verification

## Option 2: If Workspace is Separate (Less Common)

If the workspace is a separate remote environment and you need to sync:

### Step 1: See What Changed in Workspace

The workspace has these new/modified files:
- `frontend/src/utils/apiClient.ts` (NEW)
- `frontend/scripts/verify-api-client-refactor.js` (NEW)
- `frontend/package.json` (MODIFIED - added script)
- `frontend/.env.example` (MODIFIED)
- `frontend/.env.template` (MODIFIED)
- 35+ recruiter page/component files (MODIFIED)

### Step 2: Copy Changes to Your Local Repo

You have a few options:

**Option A: Manual Copy (Safest)**
1. Copy the new files from workspace to your local repo
2. Review the changes
3. Test locally
4. Commit when ready

**Option B: Use Git to Sync**
If the workspace is a git repo you can access:
```powershell
# In workspace, check what branch you're on
git branch

# If you want to create a patch
git diff > api-client-refactor.patch

# Then apply in your local repo
git apply api-client-refactor.patch
```

## Recommended Workflow

### Step 1: Verify Changes Are Available

**In your FRONTEND shell:**

```powershell
# Navigate to frontend
cd frontend

# Check if files exist
if (Test-Path "src\utils\apiClient.ts") {
    Write-Host "✅ apiClient.ts exists"
} else {
    Write-Host "❌ apiClient.ts missing - changes not synced"
}

if (Test-Path "scripts\verify-api-client-refactor.js") {
    Write-Host "✅ Verification script exists"
} else {
    Write-Host "❌ Verification script missing - changes not synced"
}

# Check package.json
$pkg = Get-Content package.json | ConvertFrom-Json
if ($pkg.scripts.'verify:api-client') {
    Write-Host "✅ Verification script in package.json"
} else {
    Write-Host "❌ Script not in package.json"
}
```

### Step 2: If Files Are Missing

If the files don't exist locally, you need to get them from the workspace. The workspace path should be accessible to you.

### Step 3: Once Files Are Present

```powershell
# 1. Setup .env
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

# Add VITE_API_BASE_URL if missing
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "VITE_API_BASE_URL") {
    Add-Content .env "`nVITE_API_BASE_URL=http://localhost:5003"
    Write-Host "✅ Added VITE_API_BASE_URL to .env"
}

# 2. Run verification (no server needed)
npm run verify:api-client

# 3. Restart frontend server to test
# (Stop current server with Ctrl+C, then:)
npm run dev
```

## Quick Check Commands

Run these to see what you have:

```powershell
# In FRONTEND shell
cd frontend

# Check for new files
Test-Path "src\utils\apiClient.ts"
Test-Path "scripts\verify-api-client-refactor.js"

# Check package.json
Get-Content package.json | Select-String "verify:api-client"

# Count files using apiClient
(Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "from '@/utils/apiClient'").Count
```

## What to Do Right Now

1. **First, check if files exist locally:**
   ```powershell
   cd frontend
   Test-Path "src\utils\apiClient.ts"
   ```

2. **If they exist:** You're good! Just run verification and test.

3. **If they don't exist:** The workspace changes need to be synced to your local repo. The workspace is at `/workspace` - you may need to copy files from there, or the workspace might be your actual working directory.

## Next Steps After Verification

Once verification passes:
1. ✅ Test the application (restart frontend server)
2. ✅ Review the changes with `git diff`
3. ✅ Commit when ready: `git add . && git commit -m "Refactor: Replace hardcoded URLs with centralized API client"`
