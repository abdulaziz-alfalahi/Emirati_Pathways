/**
 * UAE Government Design System Colors
 * Based on official UAE government branding guidelines
 */

export const colors = {
  // Primary UAE Colors
  primary: {
    red: '#C8102E',      // UAE Flag Red
    green: '#009639',    // UAE Flag Green
    white: '#FFFFFF',    // UAE Flag White
    black: '#000000',    // UAE Flag Black
  },
  
  // Government Theme Colors
  government: {
    teal: '#0D9488',     // Primary teal
    tealDark: '#0F766E', // Dark teal
    tealLight: '#14B8A6', // Light teal
    gold: '#D4AF37',     // Gold accent
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

/**
 * Get color based on stat value for visual indicators
 * @param value - The stat value (0-100 or similar)
 * @returns Tailwind color class
 */
export function getStatColor(value: number): string {
  if (value >= 80) return 'text-green-600';
  if (value >= 60) return 'text-blue-600';
  if (value >= 40) return 'text-yellow-600';
  if (value >= 20) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get background color based on stat value
 * @param value - The stat value (0-100 or similar)
 * @returns Tailwind background color class
 */
export function getStatBgColor(value: number): string {
  if (value >= 80) return 'bg-green-100';
  if (value >= 60) return 'bg-blue-100';
  if (value >= 40) return 'bg-yellow-100';
  if (value >= 20) return 'bg-orange-100';
  return 'bg-red-100';
}

export default colors;
