
/**
 * Converts various date formats to YYYY-MM format
 * @param dateStr Date string in various formats
 * @returns Formatted date in YYYY-MM format or empty string if invalid
 */
export const convertDateToYYYYMM = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    // Handle 'Present' or 'Current' special cases
    if (dateStr.toLowerCase().includes('present') || dateStr.toLowerCase().includes('current')) {
      return '';
    }
    
    // Handle month name formats (e.g., "January 2020", "Jan 2020")
    const monthNameRegex = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/i;
    if (monthNameRegex.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    }
    
    // Handle MM/DD/YYYY or DD/MM/YYYY formats
    const slashRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const slashMatch = dateStr.match(slashRegex);
    if (slashMatch) {
      // Assuming MM/DD/YYYY format for simplicity
      const month = parseInt(slashMatch[1]);
      const year = parseInt(slashMatch[3]);
      if (month >= 1 && month <= 12 && year >= 1900) {
        return `${year}-${String(month).padStart(2, '0')}`;
      }
    }
    
    // Handle YYYY-MM or YYYY/MM formats
    const yearMonthRegex = /(\d{4})[-\/](\d{1,2})/;
    const yearMonthMatch = dateStr.match(yearMonthRegex);
    if (yearMonthMatch) {
      const year = parseInt(yearMonthMatch[1]);
      const month = parseInt(yearMonthMatch[2]);
      if (year >= 1900 && month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}`;
      }
    }
    
    // Handle just year format (e.g., "2020")
    const yearRegex = /\b(\d{4})\b/;
    const yearMatch = dateStr.match(yearRegex);
    if (yearMatch) {
      return `${yearMatch[1]}-01`; // Default to January
    }
    
    return '';
  } catch (error) {
    console.error('Error converting date:', error, dateStr);
    return '';
  }
};

/**
 * Formats a date string for display in UI
 * @param dateStr Date string in YYYY-MM format
 * @param format Desired format (default: 'MMM YYYY')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateStr: string, format: 'MMM YYYY' | 'MM/YYYY' | 'YYYY-MM' = 'MMM YYYY'): string => {
  if (!dateStr) return '';
  
  try {
    // Handle YYYY-MM format
    const yearMonthRegex = /(\d{4})-(\d{2})/;
    const match = dateStr.match(yearMonthRegex);
    
    if (match) {
      const year = match[1];
      const month = parseInt(match[2]);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      switch (format) {
        case 'MMM YYYY':
          return `${monthNames[month - 1]} ${year}`;
        case 'MM/YYYY':
          return `${match[2]}/${year}`;
        case 'YYYY-MM':
          return dateStr;
        default:
          return `${monthNames[month - 1]} ${year}`;
      }
    }
    
    return dateStr;
  } catch (error) {
    console.error('Error formatting date:', error, dateStr);
    return dateStr;
  }
};

/**
 * Calculates the duration between two dates
 * @param startDate Start date in YYYY-MM format
 * @param endDate End date in YYYY-MM format (or undefined for current)
 * @returns Duration string (e.g., "2 years 3 months")
 */
export const calculateDuration = (startDate: string, endDate?: string): string => {
  if (!startDate) return '';
  
  try {
    const startParts = startDate.split('-');
    if (startParts.length !== 2) return '';
    
    const startYear = parseInt(startParts[0]);
    const startMonth = parseInt(startParts[1]) - 1; // 0-indexed
    
    let endYear: number, endMonth: number;
    
    if (endDate) {
      const endParts = endDate.split('-');
      if (endParts.length !== 2) return '';
      endYear = parseInt(endParts[0]);
      endMonth = parseInt(endParts[1]) - 1; // 0-indexed
    } else {
      // Use current date if endDate is not provided
      const now = new Date();
      endYear = now.getFullYear();
      endMonth = now.getMonth();
    }
    
    // Calculate years and months
    let years = endYear - startYear;
    let months = endMonth - startMonth;
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Format the duration
    const yearText = years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : '';
    const monthText = months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : '';
    
    if (yearText && monthText) {
      return `${yearText}, ${monthText}`;
    } else {
      return yearText || monthText || 'Less than a month';
    }
  } catch (error) {
    console.error('Error calculating duration:', error, startDate, endDate);
    return '';
  }
};
