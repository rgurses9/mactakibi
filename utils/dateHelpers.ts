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
  today.setHours(0, 0, 0, 0); // Start of today

  const matchDate = new Date(date);
  matchDate.setHours(0, 0, 0, 0);

  // 1. If date is strictly in the past (Yesterday or before) -> Past
  if (matchDate < today) return true;

  // 2. If date is strictly in the future (Tomorrow or later) -> Active (Not Past)
  if (matchDate > today) return false;

  // 3. It is TODAY. Check time.
  if (!timeStr) {
    // If no time provided, assume Active (safe default)
    return false;
  }

  try {
    // Normalize time separator (14.30 or 14:30 -> 14:30)
    const cleanTime = timeStr.trim().replace('.', ':');
    const [hours, minutes] = cleanTime.split(':').map(Number);

    if (!isNaN(hours) && !isNaN(minutes)) {
      const matchDateTime = new Date(matchDate);
      matchDateTime.setHours(hours, minutes, 0, 0);

      // If match time matches or is before current time, consider it Active? 
      // Requirement: "maç başlama tarihi ve saati o anki saatten geçmiş ise pasifte görüntüle"
      // So if matchDateTime < now -> Past.
      return matchDateTime < now;
    }
  } catch (e) {
    // Time parse error, keep as Active
    return false;
  }

  return false;
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