export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    // Normalize date string: replace / and - with .
    const cleanStr = dateStr.trim().replace(/[\/\-]/g, '.');
    
    // Try to match DD.MM.YYYY
    const parts = cleanStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-11
      const year = parseInt(parts[2], 10);
      
      // Basic validation
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        // Handle 2-digit years if necessary (though usually full year in official docs)
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month, day);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const isPastDate = (dateStr: string): boolean => {
  const date = parseDate(dateStr);
  if (!date) return false; // Default to upcoming if parsing fails to ensure visibility
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  // If date is strictly before today (yesterday or earlier), it's past
  return date < today;
};