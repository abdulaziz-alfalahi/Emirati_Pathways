# API Client Refactoring Verification Guide

## Quick Start

After completing the API client refactoring, run these tests to verify everything works:

### Option 1: Quick Verification Script (Recommended)
```bash
cd frontend
node scripts/verify-api-client-refactor.js
```

This will:
- ✅ Check for any remaining hardcoded URLs
- ✅ Verify API client exists
- ✅ Check if files are using the API client
- ✅ Verify environment configuration

### Option 2: Run All Tests
```bash
cd frontend
npm test -- api-client static-analysis
```

### Option 3: Run Individual Test Suites

**Unit Tests:**
```bash
npm test api-client-verification
```

**Static Analysis:**
```bash
npm test static-analysis
```

**Integration Tests (requires backend):**
```bash
npm test api-client-integration
# Or skip if backend not available:
SKIP_INTEGRATION_TESTS=true npm test api-client-integration
```

---

## Test Files Created

### 1. `frontend/tests/api-client-verification.test.ts`
Comprehensive unit tests for the API client:
- Initialization and configuration
- HTTP methods (GET, POST, PUT, DELETE)
- Authentication handling
- Error handling
- Response parsing

### 2. `frontend/tests/static-analysis.test.ts`
Static code analysis:
- Scans for hardcoded `localhost:5003` URLs
- Verifies API client usage in recruiter files
- Checks environment variable documentation

### 3. `frontend/tests/integration/api-client-integration.test.ts`
Integration tests:
- Real API calls (requires backend)
- Error scenario testing
- Network error handling

### 4. `frontend/scripts/verify-api-client-refactor.js`
Standalone Node.js verification script:
- Can run independently
- No dependencies on test framework
- Provides detailed output

---

## What Gets Verified

### ✅ Hardcoded URL Detection
- Scans all `.ts`, `.tsx`, `.js`, `.jsx` files
- Finds any `http://localhost:5003` or `https://localhost:5003`
- Excludes allowed contexts (comments, env files, apiClient.ts default)

### ✅ API Client Usage
- Checks if recruiter pages/components use `apiClient`
- Verifies imports are correct
- Identifies files that should use API client but don't

### ✅ Environment Configuration
- Checks `.env.example` for `VITE_API_BASE_URL`
- Verifies documentation exists

### ✅ API Client Functionality
- Tests all HTTP methods
- Tests authentication
- Tests error handling
- Tests response parsing

---

## Expected Output

### ✅ Success Example
```
🔍 Starting API Client Refactoring Verification...

✅ API Client file exists
✅ Environment configuration files exist
✅ VITE_API_BASE_URL is documented

📁 Scanning source files...
   Found 150 files to check

📊 Verification Results:

✅ No hardcoded URLs found!

📈 API Client Usage:
   Files using API client: 45
   Total files checked: 150

============================================================
✅ VERIFICATION PASSED
   All hardcoded URLs have been replaced!
============================================================
```

### ❌ Failure Example
```
❌ Found 3 files with hardcoded URLs:
   src/pages/recruiter/Offers.tsx
      Line 8: const api = (path: string) => `http://localhost:5003${path}`;
   src/components/recruiter/JobDescriptionsList.tsx
      Line 64: const response = await fetch('http://localhost:5003/api/recruiter/jd/list', {
```

---

## Manual Verification Checklist

After running automated tests, manually verify:

- [ ] **Browser Testing**
  - Open recruiter dashboard
  - Navigate to different pages
  - Check browser console for errors
  - Verify API calls work

- [ ] **Network Tab**
  - Open DevTools → Network
  - Check API requests use correct base URL
  - Verify Authorization headers are present
  - Check responses are successful

- [ ] **Environment Variables**
  - Check `.env` file has `VITE_API_BASE_URL`
  - Test with different URLs (dev/staging/prod)
  - Verify production build uses production URL

- [ ] **Code Review**
  - Review a few recruiter pages
  - Verify they import `apiClient`
  - Check they use `apiClient.get()`, `apiClient.post()`, etc.

---

## Troubleshooting

### Issue: "Cannot find module '@/utils/apiClient'"
**Solution:**
- Verify `src/utils/apiClient.ts` exists
- Check TypeScript path aliases in `tsconfig.json`
- Restart TypeScript server in your IDE

### Issue: Static analysis finds false positives
**Solution:**
- Some files are allowed (`.env.example`, comments)
- Check `ALLOWED_CONTEXTS` in test file
- If legitimate, add to allowed patterns

### Issue: Tests fail but code works
**Solution:**
- Check test environment setup
- Verify mocks are correct
- Check if tests need updating

### Issue: Integration tests fail
**Solution:**
- Make sure backend is running
- Check `VITE_API_BASE_URL` is set correctly
- Verify authentication token if needed
- Or skip with `SKIP_INTEGRATION_TESTS=true`

---

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Verify API Client Refactoring
  run: |
    cd frontend
    npm test -- api-client static-analysis
    node scripts/verify-api-client-refactor.js
```

```yaml
# GitLab CI example
verify-api-client:
  script:
    - cd frontend
    - npm test -- api-client static-analysis
    - node scripts/verify-api-client-refactor.js
```

---

## Success Criteria

Before considering the refactoring complete:

- ✅ **0 hardcoded URLs** found in source files
- ✅ **All unit tests pass**
- ✅ **Static analysis passes**
- ✅ **API client is used** in recruiter files
- ✅ **Environment variables** documented
- ✅ **Manual testing** confirms everything works
- ✅ **Production build** uses correct URL

---

## Next Steps After Verification

Once all tests pass:

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "refactor: Replace hardcoded URLs with centralized API client"
   ```

2. **Update Documentation**
   - Update README with new API client usage
   - Document environment variables
   - Add migration guide for other developers

3. **Deploy to Staging**
   - Test in staging environment
   - Verify production URL works
   - Test all recruiter workflows

4. **Deploy to Production**
   - Set production `VITE_API_BASE_URL`
   - Monitor for errors
   - Verify all features work

---

## Support

If you encounter issues:

1. Check the test output for specific errors
2. Review the test files to understand what's being checked
3. Check the API client implementation
4. Review the troubleshooting section above

---

**Created:** November 2025  
**Purpose:** Verify API client refactoring is complete and correct
