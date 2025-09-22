
import { useState, useEffect } from 'react';

export function useMobileDetection() {
  // Initialize with safe defaults to prevent null errors
  const [isMobile, setIsMobile] = useState(() => {
    // Safe check for window object
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });
  
  const [isCapacitor, setIsCapacitor] = useState(() => {
    // Safe check for window and Capacitor
    if (typeof window === 'undefined') return false;
    return !!(window as any).Capacitor;
  });

  useEffect(() => {
    // Early return if window is not available (SSR safety)
    if (typeof window === 'undefined') return;

    // Check if running in Capacitor
    const capacitorCheck = !!(window as any).Capacitor;
    setIsCapacitor(capacitorCheck);

    // Check if on mobile device
    const mobileCheck = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isCapacitor };
}
