// Simple Sign Out Fix - Direct Implementation
// This provides a working sign out solution independent of React components

class AuthFix {
  constructor() {
    this.API_BASE_URL = 'http://localhost:5003';
  }

  // Check if user is logged in
  isLoggedIn() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get current user
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Sign out function - FIXED VERSION
  async signOut() {
    try {
      console.log('🚪 Starting sign out process...');
      
      // Step 1: Get current token
      const token = localStorage.getItem('token');
      
      // Step 2: Call backend logout API if token exists
      if (token) {
        try {
          const response = await fetch(`${this.API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('✅ Backend logout successful');
          } else {
            console.warn('⚠️ Backend logout failed, continuing with local cleanup');
          }
        } catch (error) {
          console.warn('⚠️ Backend logout error, continuing with local cleanup:', error);
        }
      }
      
      // Step 3: Clear all authentication data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authState');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userPermissions');
      
      // Step 4: Clear session storage as well
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Step 5: Clear any auth cookies
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      console.log('✅ Local authentication data cleared');
      
      // Step 6: Redirect to home page
      window.location.href = '/';
      
      return true;
    } catch (error) {
      console.error('❌ Sign out error:', error);
      
      // Emergency cleanup - force clear everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Force redirect to home
      window.location.href = '/';
      
      return false;
    }
  }

  // Emergency sign out - nuclear option
  emergencySignOut() {
    console.log('🚨 Emergency sign out - clearing everything');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force reload to home page
    window.location.replace('/');
  }

  // Test sign out function
  testSignOut() {
    console.log('🧪 Testing sign out functionality...');
    console.log('Current user:', this.getCurrentUser());
    console.log('Is logged in:', this.isLoggedIn());
    
    if (this.isLoggedIn()) {
      console.log('User is logged in, proceeding with sign out...');
      return this.signOut();
    } else {
      console.log('User is not logged in');
      return Promise.resolve(true);
    }
  }
}

// Create global instance
window.authFix = new AuthFix();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthFix;
}

console.log('🔧 AuthFix loaded - Use window.authFix.signOut() to sign out');
console.log('🚨 Emergency sign out available: window.authFix.emergencySignOut()');
