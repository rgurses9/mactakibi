// Turkish month names mapping
const TURKISH_MONTHS: { [key: string]: number } = {
  'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
  'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
};

export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const cleanStr = dateStr.trim();

    // Try Turkish format: "18 Ekim 2025" or "6 Aralık 2025 Cumartesi" (with optional weekday)
    const turkishMatch = cleanStr.match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)?$/i);
    if (turkishMatch) {
      const day = parseInt(turkishMatch[1], 10);
      const monthName = turkishMatch[2].toLowerCase()
        .replace(/i̇/g, 'i') // Normalize Turkish İ
        .replace(/ı/g, 'i'); // Normalize Turkish ı
      const year = parseInt(turkishMatch[3], 10);

      // Find month number
      const monthNum = TURKISH_MONTHS[monthName];
      if (monthNum !== undefined && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthNum, day);
      }
    }

    // Fallback: Normalize date string: replace / and - with .
    const normalizedStr = cleanStr.replace(/[\/\-]/g, '.');

    // Try to match DD.MM.YYYY
    const parts = normalizedStr.split('.');
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

/**
 * Checks if the match date/time is in the past relative to NOW.
 * Returns true if match is in the past (Pasif Görev).
 * Returns false if match is in the future (Aktif Görev).
 */
export const isPastDate = (dateStr: string, timeStr?: string): boolean => {
  const date = parseDate(dateStr);
  if (!date) return false; // If date is invalid, keep it visible (Active)

  const now = new Date();

  // Create Date objects for comparison at midnight (00:00:00)
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // 1. If match day is strictly before today -> PAST
  if (matchDateAtMidnight.getTime() < todayAtMidnight.getTime()) {
    return true;
  }

  // 2. If match day is strictly after today -> FUTURE (ACTIVE)
  if (matchDateAtMidnight.getTime() > todayAtMidnight.getTime()) {
    return false;
  }

  // 3. It is TODAY. We must check the time.
  if (!timeStr) {
    // If no time provided, assume Active to be safe (or User preference)
    return false;
  }

  try {
    // Normalize time separator (14.30 or 14:30 -> 14:30)
    const cleanTime = timeStr.trim().replace('.', ':');
    const [hours, minutes] = cleanTime.split(':').map(Number);

    if (!isNaN(hours) && !isNaN(minutes)) {
      const matchDateTime = new Date(date);
      matchDateTime.setHours(hours, minutes, 0, 0);

      // STRICT CHECK:
      // If current time is greater than or equal to match time, consider it started/past.
      // Example: Match at 14:00. 
      // If Now is 13:59 -> Active (False)
      // If Now is 14:00 -> Past (True)
      return now >= matchDateTime;
    }
  } catch (e) {
    // Time parse error, keep as Active
    return false;
  }

  // Fallback: If time parsing failed logic somehow, keep active
  return false;
};

/**
 * Formats a date string to DD.MM.YYYY format
 * @param dateStr - Original date string in any supported format
 * @returns Formatted date string as DD.MM.YYYY
 */
export const formatDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  if (!date) return dateStr; // Return original if parsing fails

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};