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

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const matchDate = new Date(date);
  matchDate.setHours(0, 0, 0, 0);

  // If match date is strictly before today, it is Past.
  // If match date is Today or Future, it is Active.
  return matchDate < today;
};

export const isDateBefore = (dateStr: string, limitDateStr: string = "01.08.2025"): boolean => {
  const date = parseDate(dateStr);
  const limit = parseDate(limitDateStr);

  if (!date || !limit) return false;

  // Set times to midnight to ensure date-only comparison
  date.setHours(0, 0, 0, 0);
  limit.setHours(0, 0, 0, 0);

  return date.getTime() < limit.getTime();
};