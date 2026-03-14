
import { format, parseISO } from 'date-fns';

/**
 * UAE Standard Date Format: dd/MM/yyyy
 * Used platform-wide for consistency.
 */
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy, HH:mm';
export const DATETIME_FORMAT_12H = 'dd/MM/yyyy, h:mm a';

/**
 * Formats a Date object to dd/MM/yyyy (e.g., "12/03/2026")
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    return format(date, DATE_FORMAT);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a Date object to dd/MM/yyyy, h:mm a (e.g., "12/03/2026, 3:30 PM")
 */
export const formatDateTime = (date: Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    return format(date, DATETIME_FORMAT_12H);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
};

/**
 * Formats an ISO date string to dd/MM/yyyy (e.g., "2026-03-12" → "12/03/2026")
 */
export const formatDateFromString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, DATE_FORMAT);
  } catch (error) {
    console.error('Error formatting date string:', error);
    return 'Invalid date';
  }
};

/**
 * Formats an ISO date string to dd/MM/yyyy, h:mm a
 */
export const formatDateTimeFromString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, DATETIME_FORMAT_12H);
  } catch (error) {
    console.error('Error formatting datetime string:', error);
    return 'Invalid date';
  }
};
