import * as XLSX from 'xlsx';
import { MatchDetails } from '../types';

/**
 * Normalizes string for loose comparison (Turkish chars -> English chars).
 */
const normalizeString = (str: string): string => {
  if (!str) return "";
  return str.toLocaleUpperCase('tr-TR')
            .replace(/Ğ/g, 'G')
            .replace(/Ü/g, 'U')
            .replace(/Ş/g, 'S')
            .replace(/İ/g, 'I')
            .replace(/Ö/g, 'O')
            .replace(/Ç/g, 'C')
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
 */
export const parseWorkbookData = (data: any, type: 'array' | 'string'): MatchDetails[] => {
  const workbook = XLSX.read(data, { type: type });
  const matches: MatchDetails[] = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON with header: "A" (A, B, C...) to map columns easily
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: "A", raw: false, defval: "" });

    rows.forEach((row) => {
      // SÜTUN HARİTASI (Kullanıcı Talebi):
      // A: TARİH, B: SALON, C: SAAT, D: A TAKIMI, E: B TAKIMI
      // F: KATEGORİ, G: GRUP
      // J: SAYI GÖREVLİSİ, K: SAAT GÖREVLİSİ, L: ŞUT SAATİ GÖREVLİSİ

      const scorer = String(row['J'] || "").trim();
      const timer = String(row['K'] || "").trim();
      const shotClock = String(row['L'] || "").trim();
      
      // Target Name Parts
      const targetParts = ["RIFAT", "GURSES"]; // Check normalized (GÜRSES -> GURSES)

      // Check if "RIFAT GÜRSES" exists in any of the duty columns
      if (
        containsName(scorer, targetParts) ||
        containsName(timer, targetParts) ||
        containsName(shotClock, targetParts)
      ) {
        matches.push({
          date: String(row['A'] || "").trim(),
          hall: String(row['B'] || "").trim(),
          time: String(row['C'] || "").trim(),
          teamA: String(row['D'] || "").trim(),
          teamB: String(row['E'] || "").trim(),
          category: String(row['F'] || "").trim(),
          group: String(row['G'] || "").trim(),
          scorer: scorer,
          timer: timer,
          shotClock: shotClock
        });
      }
    });
  });

  return matches;
};

/**
 * Parses raw data (ArrayBuffer for Excel or String for CSV) directly.
 */
export const findMatchesInRawData = (data: any, isBinary: boolean): MatchDetails[] => {
    try {
        return parseWorkbookData(data, isBinary ? 'array' : 'string');
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