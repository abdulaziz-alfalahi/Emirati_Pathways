
import React, { useEffect } from 'react';
import { SECURITY_HEADERS } from '@/lib/security';

interface SecurityHeadersProps {
  additionalCSP?: string[];
  nonce?: string;
}

export const SecurityHeaders: React.FC<SecurityHeadersProps> = ({
  additionalCSP = [],
  nonce
}) => {
  // Generate nonce for inline scripts if not provided
  const scriptNonce = nonce || generateNonce();

  // Build CSP with additional directives
  const buildCSP = () => {
    let csp = SECURITY_HEADERS['Content-Security-Policy'];
    
    if (additionalCSP.length > 0) {
      csp += '; ' + additionalCSP.join('; ');
    }
    
    if (scriptNonce) {
      csp = csp.replace("'unsafe-inline'", `'nonce-${scriptNonce}'`);
    }
    
    return csp;
  };

  // Apply security headers via meta tags
  useEffect(() => {
    // Set up additional browser security features
    if (typeof window !== 'undefined') {
      // Disable right-click context menu in production
      if (window.location.hostname !== 'localhost') {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        
        return () => {
          document.removeEventListener('contextmenu', handleContextMenu);
        };
      }
    }
  }, []);

  return (
    <>
      {/* Apply security headers via useEffect */}
      {typeof document !== 'undefined' && (
        <>
          <meta httpEquiv="Content-Security-Policy" content={buildCSP()} />
          <meta httpEquiv="X-Content-Type-Options" content={SECURITY_HEADERS['X-Content-Type-Options']} />
          <meta httpEquiv="X-Frame-Options" content={SECURITY_HEADERS['X-Frame-Options']} />
          <meta httpEquiv="Referrer-Policy" content={SECURITY_HEADERS['Referrer-Policy']} />
        </>
      )}
    </>
  );
};

// Generate cryptographically secure nonce
function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
