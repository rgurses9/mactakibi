import * as XLSX from 'xlsx';
import { MatchDetails } from '../types';

/**
 * Normalizes string for loose comparison (Turkish chars -> English chars).
 * Handles: case, Turkish characters, dots, extra spaces
 */
const normalizeString = (str: string): string => {
  if (!str) return "";
  return str
    .toLocaleUpperCase('tr-TR')
    // Remove dots and extra spaces
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    // Turkish to English character mapping
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/I/g, 'I')  // Handle both İ and I
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    // Also handle lowercase versions that might slip through
    .replace(/ğ/g, 'G')
    .replace(/ü/g, 'U')
    .replace(/ş/g, 'S')
    .replace(/ı/g, 'I')
    .replace(/ö/g, 'O')
    .replace(/ç/g, 'C')
    .trim();
};

/**
 * Checks if a cell value contains the target name (Robust check).
 */
const containsName = (value: any, nameParts: string[]): boolean => {
  if (!value) return false;
  const val = normalizeString(String(value));

  // All parts must be present (e.g. "RIFAT" and "GURSES")
  return nameParts.every(part => val.includes(normalizeString(part)));
};

/**
 * Common parsing logic for both Excel files and Google Sheets CSV data.
 * It expects an array buffer or string data and processes it.
 * @param data - The raw data to parse
 * @param type - 'array' for binary or 'string' for CSV
 * @param targetNameParts - Optional array of name parts to filter by (e.g., ["RIFAT", "GURSES"])
 *                          If not provided, returns ALL matches without filtering
 */
export const parseWorkbookData = (data: any, type: 'array' | 'string', targetNameParts?: string[]): MatchDetails[] => {
  const workbook = XLSX.read(data, { type: type });
  const matches: MatchDetails[] = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON with header: "A" (A, B, C...) to map columns easily
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: "A", raw: false, defval: "" });

    rows.forEach((row) => {
      // SÜTUN HARİTASI - Supporting multiple formats:
      // Standard format: J: SAYI GÖREVLİSİ, K: SAAT GÖREVLİSİ, L: ŞUT SAATİ GÖREVLİSİ
      // MASA GÖREVLİSİ format: H, I, J, K: MASA GÖREVLİSİ 1-4
      // We check all columns H through L to support both formats

      const colH = String(row['H'] || "").trim();
      const colI = String(row['I'] || "").trim();
      const colJ = String(row['J'] || "").trim();
      const colK = String(row['K'] || "").trim();
      const colL = String(row['L'] || "").trim();

      // If no target name specified, include all rows that have valid match data
      // Otherwise, filter by the target name parts
      let shouldInclude = false;

      if (!targetNameParts || targetNameParts.length === 0) {
        // No filter - include if at least one duty column has data
        shouldInclude = colH !== "" || colI !== "" || colJ !== "" || colK !== "" || colL !== "";
      } else {
        // Filter by user name - check if name exists in ANY duty column (H through L)
        shouldInclude =
          containsName(colH, targetNameParts) ||
          containsName(colI, targetNameParts) ||
          containsName(colJ, targetNameParts) ||
          containsName(colK, targetNameParts) ||
          containsName(colL, targetNameParts);
      }

      if (shouldInclude) {
        // Collect all non-empty duty columns
        const allDuties = [colH, colI, colJ, colK, colL].filter(col => col !== "");

        // For display, we'll use the first 3 non-empty columns
        // or distribute them across scorer/timer/shotClock
        matches.push({
          date: String(row['A'] || "").trim(),
          hall: String(row['B'] || "").trim(),
          time: String(row['C'] || "").trim(),
          teamA: String(row['D'] || "").trim(),
          teamB: String(row['E'] || "").trim(),
          category: String(row['F'] || "").trim(),
          group: String(row['G'] || "").trim(),
          // Distribute all duties across the three display fields
          scorer: allDuties[0] || colJ,
          timer: allDuties[1] || colK,
          shotClock: allDuties[2] || colL
        });
      }
    });
  });

  return matches;
};

/**
 * Parses raw data (ArrayBuffer for Excel or String for CSV) directly.
 * @param data - Raw data to parse
 * @param isBinary - true for Excel binary, false for CSV string
 * @param targetNameParts - Optional name parts to filter by (e.g., ["RIFAT", "GURSES"])
 */
export const findMatchesInRawData = (data: any, isBinary: boolean, targetNameParts?: string[]): MatchDetails[] => {
  try {
    return parseWorkbookData(data, isBinary ? 'array' : 'string', targetNameParts);
  } catch (error) {
    console.error("Raw data parsing error:", error);
    return [];
  }
}

/**
 * Parses an Excel file and extracts matches for "RIFAT GÜRSES".
 */
export const findMatchesInExcel = async (file: File): Promise<MatchDetails[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const matches = parseWorkbookData(data, 'array');
        resolve(matches);
      } catch (error) {
        console.error("Excel parsing error:", error);
        reject(new Error("Excel dosyası okunamadı."));
      }
    };

    reader.onerror = () => reject(new Error("Dosya okuma hatası."));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Fetches a Google Sheet via URL (must be public/accessible) and parses it.
 */
export const findMatchesInGoogleSheet = async (url: string): Promise<MatchDetails[]> => {
  try {
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

    if (!idMatch) {
      throw new Error("Geçersiz Google Sheets bağlantısı. Lütfen linkin doğru olduğundan emin olun.");
    }

    const sheetId = idMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const response = await fetch(csvUrl);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Erişim reddedildi. Lütfen Google Sheet dosyasının 'Bağlantıya sahip herkes görüntüleyebilir' olarak ayarlandığından emin olun.");
      }
      throw new Error(`Google Sheet indirilemedi (Hata kodu: ${response.status}).`);
    }

    const csvText = await response.text();
    return parseWorkbookData(csvText, 'string');

  } catch (error: any) {
    console.error("Google Sheet Fetch Error:", error);
    throw new Error(error.message || "Google Sheet işlenirken bir hata oluştu.");
  }
};