// Simple script to clear authentication data and fix redirect loops
// Run this in browser console if you get stuck in redirect loops

console.log('🔧 Clearing authentication data...');

// Clear all authentication-related localStorage items
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');
localStorage.removeItem('auth_state');

// Clear any other potential auth-related items
Object.keys(localStorage).forEach(key => {
  if (key.includes('auth') || key.includes('token') || key.includes('user')) {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});

// Clear sessionStorage as well
sessionStorage.clear();

console.log('✅ Authentication data cleared!');
console.log('🔄 Please refresh the page and try logging in again.');

// Optionally redirect to home page
if (window.location.pathname !== '/') {
  window.location.href = '/';
}
