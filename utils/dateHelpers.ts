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

export const isPastDate = (dateStr: string, timeStr?: string): boolean => {
  const date = parseDate(dateStr);
  if (!date) return false; 
  
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // If date is strictly before today (yesterday or earlier), it's past
  if (date < today) return true;

  // If date is strictly after today, it's NOT past
  if (date > today) return false;

  // If date is TODAY, check the time
  if (timeStr) {
      try {
          // Normalize time (replace . with :) e.g. "14.00" -> "14:00"
          const cleanTime = timeStr.trim().replace('.', ':');
          const [hours, minutes] = cleanTime.split(':').map(Number);
          
          if (!isNaN(hours) && !isNaN(minutes)) {
              const matchDate = new Date(date);
              matchDate.setHours(hours, minutes, 0, 0);
              
              // If match time is before now, it is past
              return matchDate < now;
          }
      } catch (e) {
          // If time parsing fails, assume it's NOT past (keep it visible for today)
          return false;
      }
  }

  return false;
};