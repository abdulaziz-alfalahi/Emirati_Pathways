
import { format } from 'date-fns';

/**
 * Formats a date to a readable string (e.g., "May 15, 2023")
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};
