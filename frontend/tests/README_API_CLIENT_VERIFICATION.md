# API Client Refactoring Verification Tests

This directory contains comprehensive tests to verify that the API client refactoring was successful.

## Test Files

### 1. `api-client-verification.test.ts`
**Unit tests for the API client itself**
- Tests API client initialization
- Tests all HTTP methods (GET, POST, PUT, DELETE)
- Tests authentication handling
- Tests error handling
- Tests response parsing

**Run:**
```bash
npm test api-client-verification
```

### 2. `static-analysis.test.ts`
**Static analysis to find hardcoded URLs**
- Scans all source files for hardcoded `localhost:5003` URLs
- Verifies API client is being used in recruiter pages/components
- Checks environment variable documentation

**Run:**
```bash
npm test static-analysis
```

### 3. `integration/api-client-integration.test.ts`
**Integration tests with actual API**
- Tests actual API calls (requires backend running)
- Tests error scenarios
- Can be skipped in CI with `SKIP_INTEGRATION_TESTS=true`

**Run:**
```bash
# With backend running
npm test api-client-integration

# Skip if backend not available
SKIP_INTEGRATION_TESTS=true npm test api-client-integration
```

## Verification Script

### `scripts/verify-api-client-refactor.js`
**Standalone Node.js script for quick verification**

This script can be run independently to check:
- ✅ No hardcoded URLs remain
- ✅ API client exists
- ✅ Files are using API client
- ✅ Environment variables are configured

**Run:**
```bash
node scripts/verify-api-client-refactor.js
```

Or make it executable:
```bash
chmod +x scripts/verify-api-client-refactor.js
./scripts/verify-api-client-refactor.js
```

## Running All Tests

### Option 1: Run all verification tests
```bash
npm test -- api-client static-analysis
```

### Option 2: Run verification script
```bash
node scripts/verify-api-client-refactor.js
```

### Option 3: Run with coverage
```bash
npm run test:coverage -- api-client
```

## What to Check

After running the refactoring, verify:

1. ✅ **No Hardcoded URLs**
   - Run `static-analysis.test.ts`
   - Run `verify-api-client-refactor.js`
   - Should find 0 hardcoded URLs

2. ✅ **API Client Works**
   - Run `api-client-verification.test.ts`
   - All tests should pass

3. ✅ **Files Use API Client**
   - Check that recruiter pages/components import `apiClient`
   - Check that they use `apiClient.get()`, `apiClient.post()`, etc.

4. ✅ **Environment Variables**
   - `.env.example` should have `VITE_API_BASE_URL`
   - Production `.env` should be configured

5. ✅ **Integration Works**
   - Run integration tests (with backend running)
   - Test actual API calls work

## Expected Results

### ✅ Success Criteria

- **0 hardcoded URLs** in source files
- **All unit tests pass**
- **API client is used** in recruiter-related files
- **Environment variables** are documented
- **Integration tests pass** (if backend available)

### ❌ Failure Indicators

- Hardcoded URLs found in source files
- Unit tests failing
- Files not using API client
- Missing environment variable documentation

## Troubleshooting

### Tests fail with "Cannot find module '@/utils/apiClient'"
- Make sure `apiClient.ts` exists at `src/utils/apiClient.ts`
- Check TypeScript path aliases in `tsconfig.json`

### Static analysis finds false positives
- Check `ALLOWED_CONTEXTS` in `static-analysis.test.ts`
- Some files (like `.env.example`) are allowed to have URLs

### Integration tests fail
- Make sure backend is running on `http://localhost:5003`
- Or set `SKIP_INTEGRATION_TESTS=true` to skip them
- Check authentication token if needed

## CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Verify API Client Refactoring
  run: |
    npm test -- api-client static-analysis
    node scripts/verify-api-client-refactor.js
```

## Manual Verification Checklist

- [ ] Run `verify-api-client-refactor.js` - should pass
- [ ] Run unit tests - all should pass
- [ ] Run static analysis - no hardcoded URLs
- [ ] Check a few recruiter pages manually - should use `apiClient`
- [ ] Test in browser - API calls should work
- [ ] Test in production build - should use production URL

## Next Steps

After verification passes:

1. ✅ Commit the changes
2. ✅ Update documentation
3. ✅ Deploy to staging
4. ✅ Test in staging environment
5. ✅ Deploy to production

---

**Note:** These tests are designed to catch issues early and ensure the refactoring is complete and correct.
