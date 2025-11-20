# API Client Refactoring Plan: Fix Hardcoded URLs

## What Will Happen

If we proceed with fixing the hardcoded URLs by creating a centralized API client, here's the complete breakdown:

---

## 📋 Overview

**Current State:**
- 76 instances of hardcoded `http://localhost:5003` across 52 files
- Inconsistent API URL handling
- No centralized error handling
- Difficult to change API endpoints
- Will break in production/staging

**After Refactoring:**
- Single source of truth for API URLs
- Environment-based configuration
- Centralized error handling
- Easy to update endpoints
- Production-ready

---

## 🔧 What We'll Do

### Step 1: Create Centralized API Client

**New File:** `frontend/src/utils/apiClient.ts`

This will be a comprehensive API client that:
- ✅ Reads API URL from environment variables
- ✅ Handles authentication tokens automatically
- ✅ Provides consistent error handling
- ✅ Supports both fetch and axios patterns
- ✅ Handles mock tokens for development
- ✅ Provides request/response interceptors

**Benefits:**
- Single place to update API configuration
- Consistent error handling across all API calls
- Automatic token management
- Better debugging and logging

### Step 2: Update Environment Configuration

**Files to Update:**
- `frontend/.env.example` - Add `VITE_API_BASE_URL`
- `frontend/.env.template` - Add `VITE_API_BASE_URL`
- `frontend/.env.production` - Add production URL

**Changes:**
```env
# Add to .env.example
VITE_API_BASE_URL=http://localhost:5003

# For production
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Step 3: Replace All Hardcoded URLs

**Files Affected:** 52 files across:
- Pages (15+ files)
- Components (20+ files)
- Services (5+ files)
- Tests (2+ files)

**Pattern Changes:**

**Before:**
```typescript
// ❌ Hardcoded
const response = await fetch('http://localhost:5003/api/recruiter/jd/list', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```typescript
// ✅ Using API client
import { apiClient } from '@/utils/apiClient';

const response = await apiClient.get('/api/recruiter/jd/list');
```

---

## 📊 Impact Analysis

### Files That Will Change

#### High Impact (Complete Replacement)
1. **Recruiter Pages** (15 files)
   - `ActiveVacancies.tsx`
   - `Offers.tsx`
   - `Approvals.tsx`
   - `Distribution.tsx`
   - `Candidates.tsx`
   - `Analytics.tsx`
   - `Jobs.tsx`
   - `JobDescriptionWizardPage.tsx`
   - `NewJobWizard.tsx`
   - `InterviewScheduler.tsx`
   - `InterviewDetails.tsx`
   - `JDTemplates.tsx`
   - `JobDetails.tsx`
   - `BatchUpload.tsx`
   - `ShortlistPage.tsx`

2. **Recruiter Components** (20+ files)
   - `JobDescriptionsList.tsx`
   - `OfferManager.tsx`
   - `OfferDetailsDialog.tsx`
   - `CreateOfferDialog.tsx`
   - `NegotiationDialog.tsx`
   - `InterviewScheduler.tsx`
   - `CreateInterviewDialog.tsx`
   - `InterviewFeedbackDialog.tsx`
   - `MessageComposer.tsx`
   - `SourceCandidatesDialog.tsx`
   - `ScheduleInterviewDialog.tsx`
   - `ExportReportsDialog.tsx`
   - `ManageShortlistDialog.tsx`
   - `ShortlistManager.tsx`
   - `JobDescriptionWizard.tsx`
   - `JDFileUpload.tsx`
   - And more...

3. **Services** (5+ files)
   - `authService.ts`
   - `cvStorageService.ts`
   - `schoolProgramsService.ts`
   - `schoolProgramsServiceAPI.ts`

4. **Other Pages** (10+ files)
   - `RecruiterDashboard.tsx`
   - `CandidateProfilePage.tsx`
   - `AdminDashboard.tsx`
   - CV builder pages
   - Resume builder pages

#### Medium Impact (Partial Updates)
- `api.ts` - Enhance existing utility
- `authFix.js` - Update to use new client
- Test files - Update test URLs

#### Low Impact (Configuration Only)
- `.env.example`
- `.env.template`
- `.env.production`

---

## ✅ Benefits

### 1. **Production Readiness**
- ✅ Works in all environments (dev, staging, production)
- ✅ Easy to configure per environment
- ✅ No code changes needed for deployment

### 2. **Maintainability**
- ✅ Single place to update API URLs
- ✅ Consistent error handling
- ✅ Easier to add features (retry logic, caching, etc.)

### 3. **Developer Experience**
- ✅ Cleaner code
- ✅ Better TypeScript support
- ✅ Easier debugging
- ✅ Consistent patterns

### 4. **Security**
- ✅ Centralized token management
- ✅ Consistent authentication handling
- ✅ Better error handling (no token leaks)

---

## ⚠️ Potential Risks & Mitigation

### Risk 1: Breaking Changes
**Risk:** Some code might break if API client doesn't match existing patterns

**Mitigation:**
- ✅ Create comprehensive API client that supports both fetch and axios patterns
- ✅ Test each file after updating
- ✅ Keep backward compatibility where possible

### Risk 2: Missing Edge Cases
**Risk:** Some files might have special handling we miss

**Mitigation:**
- ✅ Review each file individually
- ✅ Test all recruiter workflows
- ✅ Check for custom headers or special logic

### Risk 3: Test Failures
**Risk:** Tests might fail if they expect hardcoded URLs

**Mitigation:**
- ✅ Update test files to use API client
- ✅ Use environment variables in tests
- ✅ Mock API client in unit tests

### Risk 4: Deployment Issues
**Risk:** Environment variables might not be set correctly

**Mitigation:**
- ✅ Document required environment variables
- ✅ Add validation on app startup
- ✅ Provide clear error messages

---

## 🚀 Implementation Steps

### Phase 1: Setup (1-2 hours)
1. Create `apiClient.ts` utility
2. Update environment files
3. Add TypeScript types

### Phase 2: Core Replacement (4-6 hours)
1. Replace URLs in recruiter pages (15 files)
2. Replace URLs in recruiter components (20 files)
3. Update services (5 files)

### Phase 3: Testing (2-3 hours)
1. Test all recruiter workflows
2. Verify authentication works
3. Check error handling
4. Update tests

### Phase 4: Cleanup (1-2 hours)
1. Remove unused imports
2. Update documentation
3. Code review

**Total Estimated Time:** 8-13 hours (1-2 days)

---

## 📝 Code Examples

### New API Client Structure

```typescript
// frontend/src/utils/apiClient.ts
class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
    
    // Validate on initialization
    if (!this.baseURL) {
      console.warn('VITE_API_BASE_URL not set, using default localhost:5003');
    }
  }
  
  // GET request
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }
  
  // POST request
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  // PUT request
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  // DELETE request
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
  
  // Core request method
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getAuthToken();
    const isMock = this.isMockToken(token);
    
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && !isMock ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        await this.handleError(response);
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as any;
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }
  
  // Helper methods
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }
  
  private isMockToken(token: string | null): boolean {
    const allowMock = import.meta.env.DEV || 
                     import.meta.env.VITE_ALLOW_MOCK_TOKENS === 'true';
    return allowMock && token?.startsWith('mock_token_') === true;
  }
  
  private async handleError(response: Response): Promise<never> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // Handle 401 - Unauthorized
    if (response.status === 401) {
      // Try to refresh token or redirect to login
      this.handleUnauthorized();
    }
    
    throw new ApiError(
      response.status,
      errorData.message || `API Error: ${response.statusText}`,
      errorData
    );
  }
  
  private handleUnauthorized(): void {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth_token');
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }
  
  private handleRequestError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new Error(`Network error: ${error.message}`);
    }
    
    return new Error('Unknown error occurred');
  }
}

// Custom error class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
```

### Before/After Examples

#### Example 1: Simple GET Request

**Before:**
```typescript
// ActiveVacancies.tsx
const response = await fetch('http://localhost:5003/api/recruiter/jd/list', {
  headers: {
    'Content-Type': 'application/json',
    ...(token && !isMockToken ? { 'Authorization': `Bearer ${token}` } : {})
  }
});
const data = await response.json();
```

**After:**
```typescript
// ActiveVacancies.tsx
import { apiClient } from '@/utils/apiClient';

const data = await apiClient.get('/api/recruiter/jd/list');
```

#### Example 2: POST Request with Data

**Before:**
```typescript
// Offers.tsx
const response = await fetch('http://localhost:5003/api/recruiter/offers/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(offerData)
});
```

**After:**
```typescript
// Offers.tsx
import { apiClient } from '@/utils/apiClient';

const response = await apiClient.post('/api/recruiter/offers/create', offerData);
```

#### Example 3: Error Handling

**Before:**
```typescript
if (!response.ok) {
  throw new Error('Failed to fetch');
}
```

**After:**
```typescript
try {
  const data = await apiClient.get('/api/recruiter/jd/list');
} catch (error) {
  if (error instanceof ApiError) {
    // Handle specific API errors
    console.error(`API Error ${error.status}: ${error.message}`);
  }
  // Error handling is consistent across all files
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test API client initialization
- Test environment variable handling
- Test token management
- Test error handling

### Integration Tests
- Test actual API calls in development
- Verify authentication works
- Check error scenarios

### E2E Tests
- Test complete recruiter workflows
- Verify all pages work
- Check production-like scenarios

---

## 📚 Documentation Updates

### Developer Documentation
- Update API usage guide
- Document environment variables
- Add migration guide for other developers

### Deployment Documentation
- Document required environment variables
- Add production setup guide
- Include troubleshooting section

---

## 🎯 Success Criteria

✅ All 76 hardcoded URLs replaced  
✅ Environment variables properly configured  
✅ All recruiter workflows work correctly  
✅ Tests pass  
✅ No breaking changes to existing functionality  
✅ Production deployment works  
✅ Documentation updated  

---

## ⏱️ Timeline

**Option 1: Quick Fix (1 day)**
- Create basic API client
- Replace all URLs
- Basic testing
- **Risk:** Might miss edge cases

**Option 2: Comprehensive (2-3 days)**
- Create robust API client
- Replace all URLs
- Comprehensive testing
- Documentation
- **Risk:** Lower, more thorough

**Recommendation:** Option 2 (Comprehensive approach)

---

## 🤔 Decision Points

### Should we proceed?

**Pros:**
- ✅ Production-ready code
- ✅ Better maintainability
- ✅ Easier deployment
- ✅ Consistent patterns
- ✅ Better error handling

**Cons:**
- ⚠️ Requires time investment (1-3 days)
- ⚠️ Need to test thoroughly
- ⚠️ Risk of breaking changes (mitigated by testing)

**Recommendation:** **YES** - This is a critical fix that will prevent production issues.

---

## 📞 Next Steps

If you want to proceed:

1. **Review this plan** - Make sure it aligns with your needs
2. **Approve approach** - Confirm the API client structure
3. **Set timeline** - Decide on quick fix vs comprehensive
4. **Start implementation** - I'll begin with the API client creation

Would you like me to:
- ✅ Start implementing this refactoring?
- ✅ Create a proof-of-concept first?
- ✅ Adjust the approach based on your feedback?
